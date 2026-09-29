# 2.3.0 — Account Notifications

## 1. Problem

Applikon never emails a user for anything. There is no sign-up step to speak
of — the first Google login creates the account — so a new user gets no
confirmation that anything happened, and a returning user gets no signal if
someone else's browser just logged into their account from a device they do
not recognize. For an app that stores a candidate's job search, notes, and
uploaded CVs, a silent account takeover is the kind of gap that matters.

Fixing it inside the request path is the wrong shape: a mail provider is a
third party, and login or registration must never fail because that provider
is slow or down.

## 2. Solution

Two events, each recorded as its own outbox row in the same transaction as the
action that caused it:

- **`WELCOME`** — written the moment `UserService.findOrCreateUser` creates a
  new user.
- **`NEW_DEVICE_LOGIN`** — written when a login's device fingerprint (a hash
  of `User-Agent` + IP) is not in that user's list of known fingerprints. The
  fingerprint is then added to the list.

A `@Scheduled` poller reads `PENDING` outbox rows and `POST`s each one to an
external notification service over HTTP, marking the row `SENT` on a `2xx`
response. Nothing else in Applikon needs to change: login and registration
finish exactly as they do today, and the outbox row is written in the same
transaction as the rest of the work, so a row never exists without the action
that caused it, and never gets lost if the write itself fails.

The external service's base URL comes from an environment variable
(`app.notifications.gateway-url`). What that service does with the event —
templating, delivery, retry, provider failover — is entirely its own concern
and out of scope here.

## 3. Out of scope

- Email content or templates — the receiving service owns that.
- Guaranteed delivery beyond "Applikon handed the event to the gateway and
  got a 2xx" — anything past that boundary is the gateway's problem, not
  Applikon's.
- Blocking or challenging a new-device login. This only notifies; it does not
  add a second factor or lock the account.
- A settings toggle to turn notifications off. Everyone gets both events for
  now.
- Retrying a failed `POST` beyond the outbox poller's own next scheduled
  pass — no exponential backoff, no retry counter, no dead-letter queue. If the
  gateway is down for a while, rows simply stay `PENDING` and get retried on
  the next tick. The one exception is an event the gateway rejects as invalid
  (`400`, `422`): it is marked `FAILED` and never retried.

## 4. Done when

- A new user's first Google login writes one `WELCOME` event, in the same
  transaction as the account.
- A login from a device the account has not used before writes one
  `NEW_DEVICE_LOGIN` event. The first login of an account never does, and
  neither does the first login of an account created before this release.
- A known device writes nothing, and a silent token refresh is not a login.
- Both events carry the device details (browser, IP, time).
- The poller sends pending events to the gateway with a shared secret and
  marks them sent. A gateway that is down, slow or rejecting never makes a
  login or registration fail or slow down.
