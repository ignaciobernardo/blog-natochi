WITH latest_versions AS (
  SELECT DISTINCT ON (ag.id)
    ag.id AS game_id,
    ag.challenge_id,
    agv.id AS version_id,
    agv.slug,
    agv.commit_sha,
    LENGTH(agv.slug) AS slug_length
  FROM arcade_games ag
  JOIN arcade_game_versions agv ON agv.game_id = ag.id
  WHERE agv.commit_sha IS NOT NULL
  ORDER BY ag.id, agv.version_number DESC, agv.created_at DESC, agv.id DESC
),
ranked_duplicates AS (
  SELECT
    lv.*,
    FIRST_VALUE(lv.game_id) OVER (
      PARTITION BY lv.challenge_id, lv.commit_sha
      ORDER BY lv.slug_length ASC, lv.slug ASC, lv.game_id ASC
    ) AS keep_game_id,
    ROW_NUMBER() OVER (
      PARTITION BY lv.challenge_id, lv.commit_sha
      ORDER BY lv.slug_length ASC, lv.slug ASC, lv.game_id ASC
    ) AS duplicate_rank
  FROM latest_versions lv
),
dupes AS (
  SELECT
    game_id AS discard_game_id,
    keep_game_id
  FROM ranked_duplicates
  WHERE duplicate_rank > 1
),
deleted_conflicting_votes AS (
  DELETE FROM arcade_game_votes v
  USING dupes d
  WHERE v.game_id = d.discard_game_id
    AND EXISTS (
      SELECT 1
      FROM arcade_game_votes kept
      WHERE kept.game_id = d.keep_game_id
        AND kept.user_id = v.user_id
    )
  RETURNING v.id
),
repointed_votes AS (
  UPDATE arcade_game_votes v
  SET game_id = d.keep_game_id
  FROM dupes d
  WHERE v.game_id = d.discard_game_id
  RETURNING v.id
),
repointed_plays AS (
  UPDATE arcade_game_plays p
  SET game_id = d.keep_game_id
  FROM dupes d
  WHERE p.game_id = d.discard_game_id
  RETURNING p.id
)
DELETE FROM arcade_games ag
USING dupes d
WHERE ag.id = d.discard_game_id;
