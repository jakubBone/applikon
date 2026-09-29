# 2.3.0 — User Stories

## 1. Registration

**US-1.1** — As a candidate, I want a WELCOME email when I first log in with
Google, so that I know my account was created and from which device.

**Acceptance criteria**
- The first login of a Google account writes exactly one `WELCOME` event to
  the outbox, in the same transaction that creates the user.
- The event is addressed to the email of that account.
- The event carries the device details: User-Agent, IP address and the time
  of the login.
- Later logins of the same account never write another `WELCOME`.
- The first login records the device fingerprint silently and does not also
  write a `NEW_DEVICE_LOGIN` event.

**Edge cases**
- The account already exists: the login is an ordinary login and writes no
  `WELCOME`.
- Two first logins of the same Google account arrive at almost the same time:
  one user and one `WELCOME` exist afterwards.
- Another user registers from the same device: each account gets its own
  `WELCOME`, because fingerprints belong to one user and are never shared.

## 2. Login

**US-2.1** — As a candidate, I want an email when I log in from a device I have
not used before, so that I notice if someone else is using my account.

**Acceptance criteria**
- A login with a fingerprint that is unknown for this account writes exactly
  one `NEW_DEVICE_LOGIN` event to the outbox and records the fingerprint.
- The event carries the device details: User-Agent, IP address and the time
  of the login.
- A login with a known fingerprint writes nothing.

**Edge cases**
- The same device logs in twice: only the first login writes an event, the
  second one is recognized.
- Two logins from the same new device arrive at almost the same time: one
  event and one fingerprint row, not two.
- A silent token refresh (`/api/auth/refresh`) is not a login: it writes no
  event and does not check the fingerprint.
- The IP changes while the browser stays the same (Wi-Fi to mobile data): it
  reads as a new device. This false alert is known and accepted in this
  release.

## 3. Failure

**US-3.1** — As a candidate, I want login and registration to work when the
mail side is down, so that a third-party outage never locks me out of my
account.

**Acceptance criteria**
- Login and registration return the same result, in the same time, whether the
  gateway is reachable, slow or down.
- A failed or timed-out call to the gateway leaves the event `PENDING` and
  raises no error in the login or registration request.
- When the gateway is back, the pending events are sent on the poller's next
  run, without manual action.

**Edge cases**
- The gateway is down for a long time: events stay `PENDING` and nothing is
  lost. Nobody is told that a mail is late. This is accepted for this release.
