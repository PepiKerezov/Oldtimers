import { defineConfig } from "prisma/config";
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

// CLI / migrate operations prefer DIRECT_URL (non-pooled) when present —
// `prisma migrate deploy` needs a real single connection, not the PgBouncer
// pooler. Falls back to DATABASE_URL for local Docker dev where there is no
// pooling split. The running app (src/lib/db.ts) always uses DATABASE_URL.
export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL || "",
  },
});
