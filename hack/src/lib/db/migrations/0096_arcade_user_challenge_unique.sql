ALTER TABLE "arcade_games"
  ADD CONSTRAINT "arcade_games_github_username_challenge_id_unique"
  UNIQUE("github_username","challenge_id");
