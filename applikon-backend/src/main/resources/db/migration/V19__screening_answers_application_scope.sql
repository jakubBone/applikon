-- v2 cheat sheet: scope screening answers to a single application.
--
-- A NULL application_id keeps a row in the user's global "My answers" set (unchanged
-- behaviour). A non-null application_id scopes the answer to one application — used by
-- the "About the company" prep. Per-application rows cascade-delete with their application.
--
-- The applications.company_research column (added in V18) is intentionally left in place
-- for now; it is dropped in a later migration once this path is verified.
ALTER TABLE screening_answers
    ADD COLUMN application_id BIGINT REFERENCES applications (id) ON DELETE CASCADE;

CREATE INDEX idx_screening_answers_user_application
    ON screening_answers (user_id, application_id);
