import { eq } from "drizzle-orm";
import { notFound } from "../../common/utils";
import db from "../../db/connection";
import { categories } from "../../db/schema";
import type { CreateCategoryBody, UpdateCategoryBody } from "./categories.schema";

export abstract class CategoryService {
  static async findAll() {
    return db.query.categories.findMany({
      orderBy: categories.name,
    });
  }

  static async findById(id: string) {
    const category = await db.query.categories.findFirst({
      where: eq(categories.id, id),
    });

    if (!category) {
      throw notFound("Kategori tidak ditemukan");
    }

    return category;
  }

  static async create(data: CreateCategoryBody) {
    const [category] = await db
      .insert(categories)
      .values({
        name: data.name,
        icon: data.icon,
        color: data.color,
        type: data.type,
      })
      .returning();

    return category;
  }

  static async update(id: string, data: UpdateCategoryBody) {
    const existing = await this.findById(id);
    if (!existing) {
      throw notFound("Kategori tidak ditemukan");
    }

    const [updated] = await db
      .update(categories)
      .set(data)
      .where(eq(categories.id, id))
      .returning();

    return updated;
  }

  static async delete(id: string) {
    const existing = await this.findById(id);
    if (!existing) {
      throw notFound("Kategori tidak ditemukan");
    }

    await db.delete(categories).where(eq(categories.id, id));

    return { success: true };
  }

  static async seedDefaultCategories() {
    const defaultCategories = [
      { name: "Gaji", icon: "💰", color: "#22c55e", type: "income" as const },
      { name: "Freelance", icon: "💻", color: "#3b82f6", type: "income" as const },
      { name: "Investasi", icon: "📈", color: "#8b5cf6", type: "income" as const },
      { name: "Makanan", icon: "🍔", color: "#ef4444", type: "expense" as const },
      { name: "Transportasi", icon: "🚗", color: "#f97316", type: "expense" as const },
      { name: "Belanja", icon: "🛒", color: "#ec4899", type: "expense" as const },
      { name: "Tagihan", icon: "📄", color: "#6366f1", type: "expense" as const },
      { name: "Hiburan", icon: "🎮", color: "#14b8a6", type: "expense" as const },
      { name: "Kesehatan", icon: "🏥", color: "#f43f5e", type: "expense" as const },
      { name: "Pendidikan", icon: "📚", color: "#0ea5e9", type: "expense" as const },
    ];

    await db.insert(categories).values(defaultCategories);
  }
}
