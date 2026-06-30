-- V17__screening_answers.sql
-- Global per-user "My answers" screening template (Applikon v2).

CREATE TABLE screening_answers (
    id           BIGSERIAL PRIMARY KEY,
    user_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_key VARCHAR(64),
    label        VARCHAR(255),
    answer       TEXT,
    custom       BOOLEAN      NOT NULL DEFAULT false,
    sort_order   INT          NOT NULL DEFAULT 0,
    created_at   TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at   TIMESTAMP
);

CREATE INDEX idx_screening_answers_user_id ON screening_answers(user_id);
