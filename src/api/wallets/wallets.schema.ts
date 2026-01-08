import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { t, type Static } from "elysia";
import { wallets } from "../../db/schema";

export const walletInsert = createInsertSchema(wallets);
export const walletSelect = createSelectSchema(wallets);

export type WalletInsert = Static<typeof walletInsert>;
export type Wallet = Static<typeof walletSelect>;

export const createWalletBody = t.Object({
  name: t.String({
    minLength: 1,
    default: "Cash",
    examples: ["Cash", "Bank BCA", "GoPay", "OVO"],
  }),
  balance: t.Optional(t.String({
    default: "0",
    examples: ["0", "1000000", "5000000"],
  })),
  icon: t.Optional(t.String({
    default: "💰",
    examples: ["💰", "🏦", "💳", "📱"],
  })),
  color: t.Optional(t.String({
    default: "#22c55e",
    examples: ["#22c55e", "#3b82f6", "#ef4444"],
  })),
});

export const updateWalletBody = t.Partial(t.Object({
  name: t.String({
    minLength: 1,
    examples: ["Cash", "Bank BCA"],
  }),
  balance: t.String({
    examples: ["1000000", "5000000"],
  }),
  icon: t.String({
    examples: ["💰", "🏦"],
  }),
  color: t.String({
    examples: ["#22c55e", "#3b82f6"],
  }),
}));

export type CreateWalletBody = Static<typeof createWalletBody>;
export type UpdateWalletBody = Static<typeof updateWalletBody>;
