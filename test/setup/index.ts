import { afterAll, beforeAll, beforeEach } from "bun:test";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import db, { closeDb } from "../../src/db/connection";
import { sql } from "drizzle-orm";

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "drizzle/migrations" });
});

beforeEach(async () => {
  const queries = [
    "DELETE FROM transactions",
    "DELETE FROM wallets",
    "DELETE FROM categories",
    "DELETE FROM sessions",
    "DELETE FROM accounts",
    "DELETE FROM verifications",
    "DELETE FROM users",
  ];

  for (const q of queries) {
    await db.execute(sql.raw(q));
  }
});

afterAll(() => {
  closeDb();
});
