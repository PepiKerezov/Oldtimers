-- Add subject with a temporary default so existing rows backfill,
-- then drop the default so new rows must provide one.
ALTER TABLE "ContactSubmission" ADD COLUMN "subject" TEXT NOT NULL DEFAULT '(без тема)';
ALTER TABLE "ContactSubmission" ALTER COLUMN "subject" DROP DEFAULT;
