-- Drop the V18 applications.company_research column. Per-application "About the company"
-- prep now lives in screening_answers rows (V19), so this column has been dormant since.
ALTER TABLE applications DROP COLUMN company_research;
