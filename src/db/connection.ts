import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { logger } from "../common/logger";
import * as schema from "./schema";

const connectionString = Bun.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/finance_tracker";

const client = postgres(connectionString);

export const db = drizzle(client, { schema, logger });
export const closeDb = () => client.end();
export const rawDb = client;

export default db;
