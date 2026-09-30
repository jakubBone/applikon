-- 2.3.0: account notifications. known_devices is the memory of which devices a user has
-- logged in from; notification_outbox is the queue of events waiting for the gateway.

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
