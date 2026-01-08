import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { t, type Static } from "elysia";
import { transactions } from "../../db/schema";

export const transactionInsert = createInsertSchema(transactions);
export const transactionSelect = createSelectSchema(transactions);

export type TransactionInsert = Static<typeof transactionInsert>;
export type Transaction = Static<typeof transactionSelect>;

export const createTransactionBody = t.Object({
  type: t.Union([t.Literal("income"), t.Literal("expense")], {
    default: "expense",
    examples: ["expense", "income"],
  }),
  amount: t.String({
    default: "50000",
    examples: ["50000", "1500000"],
  }),
  walletId: t.Optional(t.String({
    format: "uuid",
    examples: ["550e8400-e29b-41d4-a716-446655440000"],
  })),
  categoryId: t.Optional(t.String({
    format: "uuid",
    examples: ["550e8400-e29b-41d4-a716-446655440000"],
  })),
  description: t.Optional(t.String({
    default: "Makan siang",
    examples: ["Makan siang", "Gaji bulan Januari", "Belanja bulanan"],
  })),
  date: t.Optional(t.String({
    format: "date-time",
    default: new Date().toISOString(),
    examples: ["2026-01-07T12:00:00.000Z"],
  })),
});

export const updateTransactionBody = t.Partial(t.Object({
  type: t.Union([t.Literal("income"), t.Literal("expense")], {
    examples: ["expense", "income"],
  }),
  amount: t.String({
    examples: ["75000", "2000000"],
  }),
  walletId: t.String({
    format: "uuid",
    examples: ["550e8400-e29b-41d4-a716-446655440000"],
  }),
  categoryId: t.String({
    format: "uuid",
    examples: ["550e8400-e29b-41d4-a716-446655440000"],
  }),
  description: t.String({
    examples: ["Makan malam", "Bonus tahunan"],
  }),
  date: t.String({
    format: "date-time",
    examples: ["2026-01-07T18:00:00.000Z"],
  }),
}));

export const transactionQuery = t.Object({
  type: t.Optional(t.Union([t.Literal("income"), t.Literal("expense")], {
    examples: ["expense", "income"],
  })),
  walletId: t.Optional(t.String({
    format: "uuid",
    examples: ["550e8400-e29b-41d4-a716-446655440000"],
  })),
  categoryId: t.Optional(t.String({
    format: "uuid",
    examples: ["550e8400-e29b-41d4-a716-446655440000"],
  })),
  startDate: t.Optional(t.String({
    examples: ["2026-01-01"],
  })),
  endDate: t.Optional(t.String({
    examples: ["2026-01-31"],
  })),
  page: t.Optional(t.String({
    default: "1",
    examples: ["1", "2"],
  })),
  limit: t.Optional(t.String({
    default: "20",
    examples: ["10", "20", "50"],
  })),
});

export type CreateTransactionBody = Static<typeof createTransactionBody>;
export type UpdateTransactionBody = Static<typeof updateTransactionBody>;
export type TransactionQuery = Static<typeof transactionQuery>;
