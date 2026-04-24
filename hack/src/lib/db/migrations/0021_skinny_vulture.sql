CREATE INDEX IF NOT EXISTS "hackers_email_idx" ON "hackers" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hackers_github_idx" ON "hackers" USING btree ("github");