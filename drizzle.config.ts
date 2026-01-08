import type { Config } from "drizzle-kit";

export default {
  schema: "src/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: Bun.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/finance_tracker"
  }
} satisfies Config;
