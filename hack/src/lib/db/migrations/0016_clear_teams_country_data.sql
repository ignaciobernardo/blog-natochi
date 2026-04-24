-- Custom SQL migration file, put you code below! --

-- NOTE: As of this migration, submissions.country is now the source of truth for country data
-- The teams.country column is kept for backward compatibility but should no longer be written to
-- All review queries now use submissions.country instead of teams.country