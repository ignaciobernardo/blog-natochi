-- Custom SQL migration file, put you code below! --

-- Populate formation_status based on solo_participant and team_looking
UPDATE teams
SET formation_status = CASE
  WHEN solo_participant = true THEN 'solo'::team_formation_status
  WHEN team_looking = true THEN 'looking'::team_formation_status
  ELSE 'formed'::team_formation_status
END;
