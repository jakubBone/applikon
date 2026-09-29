# 2.3.0 06-account-notifications — Implementation Plan

## What changes

**Backend, new**
```
db/migration/V24__account_notifications.sql
entity/NotificationOutbox.java        
entity/NotificationType.java   (WELCOME | NEW_DEVICE_LOGIN)
entity/OutboxStatus.java              (PENDING | SENT)
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
(`app.notifications.gateway-url`).

No frontend changes — this is entirely server-side, invisible in the UI.

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
    payload          JSONB,                         -- User-Agent, IP, login time; NULL once SENT
    idempotency_key  VARCHAR(255) NOT NULL UNIQUE,  -- WELCOME:userId | NEW_DEVICE_LOGIN:userId:fingerprintHash
    status           VARCHAR(16) NOT NULL DEFAULT 'PENDING',
    created_at       TIMESTAMP NOT NULL,
    sent_at          TIMESTAMP
);

CREATE INDEX idx_notification_outbox_pending ON notification_outbox (status, created_at);
```

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
| `WELCOME` | `WELCOME:42` | the one welcome of user 42 |
| `NEW_DEVICE_LOGIN` | `NEW_DEVICE_LOGIN:42:9f3ab1…` | the alert for user 42 about that device |

**Checklist**
- [ ] Migration applies cleanly on a fresh DB and on the existing dev DB
- [ ] `idempotency_key` uniqueness verified with a duplicate-insert test

## Step 2 — Device fingerprinting and outbox writes

`DeviceFingerprintService.checkAndRecord(userId, userAgent, ip)` returns
`true` when the fingerprint was unknown (and records it), `false` when it was
already known. It is also what records a new user's first device: the caller
just ignores the result. If two requests insert the same fingerprint at the
same moment, the unique constraint rejects the second insert; the service
catches that and returns `false`.

`NotificationOutboxService` has two methods, `enqueueWelcome(user, device)` and
`enqueueNewDeviceLogin(user, device)`. The idempotency key is
`WELCOME:userId` and `NEW_DEVICE_LOGIN:userId:fingerprintHash`. A date in the
key would drop a second alert from a different new device on the same day.

**Build**
- `DeviceFingerprintService`: SHA-256 over `userAgent + "|" + ip`.
- `NotificationOutboxService`: the payload carries the device details
  (User-Agent, IP, login time) next to `type`, `recipient` and
  `idempotencyKey`, matching the contract of the receiving side.

**Tests**
- Same fingerprint twice for the same user → second call returns `false`,
  no new row in `known_devices`.
- Different user, same fingerprint → treated as unknown (fingerprints are
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
- New user → `deviceFingerprintService.checkAndRecord(...)` (result ignored,
  it records the first device silently), then
  `notificationOutboxService.enqueueWelcome(user, device)`. No
  `NEW_DEVICE_LOGIN` is written.
- Existing user → `deviceFingerprintService.checkAndRecord(...)`; if
  unknown, `notificationOutboxService.enqueueNewDeviceLogin(user, device)`.

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
- Silent token refresh (`/api/auth/refresh`) never triggers either event —
  only the OAuth2 callback path does.
- Two first logins of the same Google account at once → one user, one
  `WELCOME` row, no failed login.

**Done when**
- A fresh login end-to-end (test hitting the OAuth2 success handler path)
  produces exactly the right outbox row for each of the four scenarios
  above.

**Checklist**
- [ ] `findOrCreateUser` signature change compiles and all existing callers
      updated
- [ ] Concurrent first login handled in `findOrCreateUser`
- [ ] Integration tests for the four login scenarios green

## Step 4 — Poller and gateway client

`NotificationGatewayClient` wraps a `RestClient` (or `RestTemplate`) pointed
at `app.notifications.gateway-url`, exposing `send(NotificationOutbox row)`
that returns whether the call got a `2xx`. `NotificationPoller` is
`@Scheduled(fixedDelay = ...)`, reads `PENDING` rows ordered by
`created_at`, calls the client for each, and on success marks the row `SENT`
with `sent_at` and sets `payload` to `NULL`, so the IP and User-Agent do not
outlive the delivery. A failure (non-2xx, timeout, connection refused) leaves the row
untouched — no retry counter, no backoff, per the brief's out-of-scope.

**Build**
- `NotificationGatewayClient`: one method, short connect/read timeout (a few
  seconds — this must never make the poller hang).
- `NotificationPoller`: transactional per row (one row's failure must not
  stop the rest of the batch from being attempted).

**Tests**
- `MockRestServiceServer` (or an equivalent HTTP stub) returning `202` →
  row moves to `SENT` and its `payload` is `NULL`.
- Stub returning `500` → row stays `PENDING`.
- Stub not responding within the client timeout → row stays `PENDING`, the
  poller run still finishes (does not hang waiting on one row).

**Done when**
- The poller runs on its own schedule and never touches the login/
  registration request path — verified by the Step 3 tests still passing
  with the gateway entirely unreachable.

**Checklist**
- [ ] `NotificationGatewayClient` unit tests green (2xx / error / timeout)
- [ ] `NotificationPoller` unit tests green, including the "one bad row
      doesn't block the batch" case
- [ ] `app.notifications.gateway-url` documented in `.env.example`

## Step 5 — Manual verification

- [ ] Point `app.notifications.gateway-url` at a throwaway local HTTP
      listener (e.g. `nc -l` or a one-line stub server), register a fresh
      Google account, confirm the request body matches the contract.
- [ ] Kill the listener, log in again from the same browser: no crash, no
      slowdown, application logs show the failed `POST` and the row staying
      `PENDING`.
