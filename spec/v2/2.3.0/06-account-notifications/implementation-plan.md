# 2.3.0 06-account-notifications — Implementation Plan

## What changes

**Backend, new**
```
db/migration/V24__account_notifications.sql
entity/NotificationOutbox.java
entity/NotificationType.java   (WELCOME | NEW_DEVICE_LOGIN)
entity/OutboxStatus.java       (PENDING | SENT | FAILED)
entity/KnownDevice.java
repository/NotificationOutboxRepository.java
repository/KnownDeviceRepository.java
service/notification/NotificationOutboxService.java   (writes rows, called from the login flow)
service/notification/DeviceFingerprintService.java     (hash User-Agent + IP, look up / record)
service/notification/NotificationPoller.java            (@Scheduled, sends PENDING rows)
service/notification/NotificationGatewayClient.java     (POST to app.notifications.gateway-url)
```

**Backend, changed:** `UserService.findOrCreateUser` (needs to tell its caller
whether the user was newly created), `OAuth2AuthenticationSuccessHandler`
(reads `User-Agent` + remote address, calls the fingerprint check and writes
the outbox row), `application.yml` / `.env.example`
(`app.notifications.gateway-url`, `app.notifications.gateway-key`).

No frontend changes — this is entirely server-side, invisible in the UI.

## The request to the gateway

The contract lives here, because Applikon is the sender and this is the only
place that pins it down.

```
POST {app.notifications.gateway-url}/notifications
Content-Type: application/json
X-Api-Key: {app.notifications.gateway-key}

{
  "type": "WELCOME" | "NEW_DEVICE_LOGIN",
  "recipient": "user@example.com",
  "idempotencyKey": "WELCOME:<userId>",
  "payload": {
    "name": "Jan",
    "userAgent": "...",
    "ip": "...",
    "loggedInAt": "2026-09-29T10:15:00Z"
  }
}
```

| Response | What Applikon does |
|---|---|
| `2xx` | marks the row `SENT`, clears `payload` |
| `400`, `422` (the event itself is invalid) | marks the row `FAILED`, never retried |
| anything else (`5xx`, `401`, `404`, timeout, no connection) | leaves the row `PENDING`, tried again on the next run |

A wrong or missing key gives `401`, which stays retryable on purpose: a
misconfigured key must not burn every event.

The gateway treats a repeated `idempotencyKey` as a no-op, because Applikon can
send the same event twice (see Step 4). `userAgent` comes from the browser, so
the gateway treats it as plain text and never as markup.

## Step 1 — Schema

### 1.1 Migration `V24__account_notifications.sql`

```sql
CREATE TABLE known_devices (
    id               BIGSERIAL PRIMARY KEY,
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fingerprint_hash VARCHAR(64) NOT NULL,          -- SHA-256 of User-Agent + IP
    first_seen_at    TIMESTAMP NOT NULL,
    CONSTRAINT uq_known_device UNIQUE (user_id, fingerprint_hash)
);

CREATE TABLE notification_outbox (
    id               BIGSERIAL PRIMARY KEY,
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type             VARCHAR(32) NOT NULL,          -- WELCOME | NEW_DEVICE_LOGIN
    recipient        VARCHAR(255) NOT NULL,
    payload          TEXT,                          -- JSON as text: User-Agent, IP, login time; NULL once SENT
    idempotency_key  VARCHAR(255) NOT NULL UNIQUE,  -- WELCOME:userId | NEW_DEVICE_LOGIN:userId:fingerprintHash
    status           VARCHAR(16) NOT NULL DEFAULT 'PENDING',  -- PENDING | SENT | FAILED
    created_at       TIMESTAMP NOT NULL,
    sent_at          TIMESTAMP
);

CREATE INDEX idx_notification_outbox_pending ON notification_outbox (status, created_at);
```

`payload` is `TEXT`, not `JSONB`: nothing in the project uses `JSONB`, the
tests run on H2, and Applikon never queries inside the JSON.

### 1.2 Two tables, two jobs

`notification_outbox` is a parcel. One row is one event that must reach the
gateway: its type, its recipient, and a `payload` with the mail content (the
IP and User-Agent). Once the gateway takes it, the row is `SENT` and the
`payload` is cleared.

`known_devices` is the memory. One row is one device the user has already
logged in from, stored as a hash only. Deciding whether a login is new reads
this table, never the outbox, so clearing an outbox payload changes nothing.

The `idempotency_key` is a plain text value in a column of the outbox row, not
a separate record. It names the event, and its `UNIQUE` constraint lets the
database refuse a second row for the same event.

| `type` | `idempotency_key` | Meaning |
|---|---|---|
| `WELCOME` | `WELCOME:<userId>` | the one welcome of that user |
| `NEW_DEVICE_LOGIN` | `NEW_DEVICE_LOGIN:<userId>:9f3ab1…` | the alert for that user about that device |

**Checklist**
- [ ] Migration applies cleanly on a fresh DB and on the existing dev DB
      (tests run with Flyway off, so this one is checked by hand)
- [ ] `idempotency_key` uniqueness verified with a duplicate-insert test

## Step 2 — Device fingerprinting and outbox writes

`DeviceFingerprintService.checkAndRecord(userId, userAgent, ip)` records the
fingerprint and returns one of three results:

- `FIRST_DEVICE` — the user had no known device at all (a new account, or an
  account from before this release). Recorded, no alert.
- `NEW_DEVICE` — the user has other known devices, this one is new. Recorded.
- `KNOWN` — already recorded, nothing to do.

If two requests insert the same fingerprint at the same moment, the unique
constraint rejects the second insert; the service catches that and returns
`KNOWN`.

`NotificationOutboxService` has two methods, `enqueueWelcome(user, device)` and
`enqueueNewDeviceLogin(user, device)`. The idempotency key is
`WELCOME:userId` and `NEW_DEVICE_LOGIN:userId:fingerprintHash`. A date in the
key would drop a second alert from a different new device on the same day.

**Build**
- `DeviceFingerprintService`: SHA-256 over `userAgent + "|" + ip`. The
  `User-Agent` is cut to 255 characters before hashing and before it goes into
  a payload.
- `NotificationOutboxService`: the payload carries the device details
  (User-Agent, IP, login time in UTC) and the user's name, as in the contract
  above.

**Tests**
- User with no known device → `FIRST_DEVICE`. Same fingerprint again →
  `KNOWN`, no new row in `known_devices`.
- User with one known device, different fingerprint → `NEW_DEVICE`.
- Different user, same fingerprint → judged on its own list (fingerprints are
  scoped per user, not global).
- Two simultaneous inserts of the same fingerprint → one row, both calls
  return without an error.
- Enqueuing the same event twice is a no-op (unique constraint on
  `idempotency_key`, caught and ignored, not thrown as a request-failing
  error).
- Two different new devices on the same day → two `NEW_DEVICE_LOGIN` rows.
- The payload holds User-Agent, IP and login time.

**Done when**
- Both services are covered by unit tests with no dependency on the HTTP
  layer or the scheduler.

**Checklist**
- [ ] `DeviceFingerprintService` unit tests green
- [ ] `NotificationOutboxService` unit tests green, including the duplicate
      idempotency key case

## Step 3 — Wire into the login flow

`UserService.findOrCreateUser` currently returns only a `User`. It needs to
tell the caller whether the user is new, since that is the only signal for
`WELCOME`. Smallest change: return a small record,
`UserLoginResult(User user, boolean isNewUser)`, and update the one caller
(`OAuth2AuthenticationSuccessHandler`).

In `OAuth2AuthenticationSuccessHandler.onAuthenticationSuccess`, after the
existing token issuance:
- New user → `checkAndRecord(...)` (it records the first device, the result
  is ignored), then `enqueueWelcome(user, device)`. No `NEW_DEVICE_LOGIN` is
  written.
- Existing user → `checkAndRecord(...)`; only `NEW_DEVICE` leads to
  `enqueueNewDeviceLogin(user, device)`. `FIRST_DEVICE` (an account from
  before this release, logging in for the first time since) and `KNOWN` write
  nothing.

Two first logins of the same Google account at once: both miss the user, both
insert, and the unique `google_id` rejects the second. Today that fails the
login. `findOrCreateUser` catches the rejection, re-reads the user and returns
`isNewUser = false`, so exactly one user and one `WELCOME` exist.

Both calls happen inside the same flow that already runs without an explicit
`@Transactional` boundary at the handler level — `findOrCreateUser` and the
outbox write need to share one transaction, so the outbox write moves inside
`UserService` (a new `@Transactional` method there), not into the handler
directly.

**Tests**
- First-ever login for a Google account → one `WELCOME` row, no
  `NEW_DEVICE_LOGIN` row.
- Second login right after registration, same browser → no new outbox row
  (the first device was recorded silently).
- Second login, different `User-Agent` → one `NEW_DEVICE_LOGIN` row.
- Existing account with no known device (created before this release) logs
  in → no outbox row, the device is recorded.
- Silent token refresh (`/api/auth/refresh`) never triggers either event —
  only the OAuth2 callback path does.
- Two first logins of the same Google account at once → one user, one
  `WELCOME` row, no failed login.

**Done when**
- A fresh login end-to-end (test hitting the OAuth2 success handler path)
  produces exactly the right outbox row for each of the scenarios above.

**Checklist**
- [ ] `findOrCreateUser` signature change compiles and all existing callers
      updated
- [ ] Concurrent first login handled in `findOrCreateUser`
- [ ] Integration tests for the login scenarios green

## Step 4 — Poller and gateway client

`NotificationGatewayClient` wraps a `RestClient` (or `RestTemplate`) pointed
at `app.notifications.gateway-url`, sends the request from "The request to the
gateway" including the `X-Api-Key` header, and returns the outcome of the call
(`2xx`, invalid event, or retry later).

`NotificationPoller` is `@Scheduled(fixedDelay = ...)`. One run reads a batch
of `PENDING` rows ordered by `created_at`, and for each row:

1. calls the gateway, with no database transaction open;
2. then, in a short transaction of its own, marks the row `SENT` (with
   `sent_at`, and `payload` set to `NULL` so the IP and User-Agent do not
   outlive the delivery), or `FAILED`, or leaves it alone.

The network call stays outside the transaction so a slow gateway never holds
a database connection. The price is a small window: if Applikon stops after
the `POST` and before marking `SENT`, the row is sent again on the next run.
That is why the request carries the `idempotencyKey`. There is no retry
counter and no backoff, per the brief's out-of-scope.

**Build**
- `NotificationGatewayClient`: one method, short connect/read timeout (a few
  seconds — this must never make the poller hang).
- `NotificationPoller`: a bounded batch per run, and one row's failure must
  not stop the rest of the batch from being attempted.

**Tests**
- `MockRestServiceServer` (or an equivalent HTTP stub) returning `202` →
  row moves to `SENT` and its `payload` is `NULL`.
- Stub returning `500` → row stays `PENDING`.
- Stub returning `401` → row stays `PENDING`.
- Stub returning `400` → row moves to `FAILED`, and the next run does not send
  it again.
- Stub not responding within the client timeout → row stays `PENDING`, the
  poller run still finishes (does not hang waiting on one row).
- The request carries `X-Api-Key` and the row's `idempotencyKey`.

**Done when**
- The poller runs on its own schedule and never touches the login/
  registration request path — verified by the Step 3 tests still passing
  with the gateway entirely unreachable.

**Checklist**
- [ ] `NotificationGatewayClient` unit tests green (2xx / 400 / 401 / 5xx /
      timeout)
- [ ] `NotificationPoller` unit tests green, including the "one bad row
      doesn't block the batch" case
- [ ] `app.notifications.gateway-url` and `app.notifications.gateway-key`
      documented in `.env.example`

## Step 5 — Manual verification

- [ ] Point `app.notifications.gateway-url` at a throwaway local HTTP
      listener (e.g. `nc -l` or a one-line stub server), register a fresh
      Google account, confirm the request body and the `X-Api-Key` header
      match the contract.
- [ ] Kill the listener, log in again from the same browser: no crash, no
      slowdown, application logs show the failed `POST` and the row staying
      `PENDING`.

## Step 6 — Docs

- [ ] Privacy policy mentions the emails and the processing of IP and
      User-Agent
- [ ] `architecture.md` and `security.md` describe the new tables, the poller
      and the gateway call
- [ ] The two new environment variables are added to the deployment guide
