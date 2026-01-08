import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { t, type Static } from "elysia";
import { categories } from "../../db/schema";

export const categoryInsert = createInsertSchema(categories);
export const categorySelect = createSelectSchema(categories);

export type CategoryInsert = Static<typeof categoryInsert>;
export type Category = Static<typeof categorySelect>;

export const createCategoryBody = t.Object({
  name: t.String({
    minLength: 1,
    default: "Makanan",
    examples: ["Makanan", "Transportasi", "Gaji", "Freelance"],
  }),
  icon: t.Optional(t.String({
    default: "🍔",
    examples: ["🍔", "🚗", "💰", "💻"],
  })),
  color: t.Optional(t.String({
    default: "#ef4444",
    examples: ["#ef4444", "#22c55e", "#3b82f6"],
  })),
  type: t.Union([t.Literal("income"), t.Literal("expense")], {
    default: "expense",
    examples: ["expense", "income"],
  }),
});

export const updateCategoryBody = t.Partial(t.Object({
  name: t.String({
    minLength: 1,
    examples: ["Makanan & Minuman", "Transport"],
  }),
  icon: t.String({
    examples: ["🍕", "🚕"],
  }),
  color: t.String({
    examples: ["#f97316", "#14b8a6"],
  }),
  type: t.Union([t.Literal("income"), t.Literal("expense")], {
    examples: ["expense", "income"],
  }),
}));

export type CreateCategoryBody = Static<typeof createCategoryBody>;
export type UpdateCategoryBody = Static<typeof updateCategoryBody>;
