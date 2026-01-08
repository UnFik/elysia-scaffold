import { eq, and } from "drizzle-orm";
import { notFound } from "../../common/utils";
import db from "../../db/connection";
import { wallets } from "../../db/schema";
import type { CreateWalletBody, UpdateWalletBody } from "./wallets.schema";

export abstract class WalletService {
  static async findAll(userId: string) {
    return db.query.wallets.findMany({
      where: eq(wallets.userId, userId),
      orderBy: wallets.name,
    });
  }

  static async findById(id: string, userId: string) {
    const wallet = await db.query.wallets.findFirst({
      where: and(eq(wallets.id, id), eq(wallets.userId, userId)),
    });

    if (!wallet) {
      throw notFound("Wallet tidak ditemukan");
    }

    return wallet;
  }

  static async create(userId: string, data: CreateWalletBody) {
    const [wallet] = await db
      .insert(wallets)
      .values({
        userId,
        name: data.name,
        balance: data.balance || "0",
        icon: data.icon,
        color: data.color,
      })
      .returning();

    return wallet;
  }

  static async update(id: string, userId: string, data: UpdateWalletBody) {
    await this.findById(id, userId);

    const [updated] = await db
      .update(wallets)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(wallets.id, id), eq(wallets.userId, userId)))
      .returning();

    return updated;
  }

  static async delete(id: string, userId: string) {
    await this.findById(id, userId);

    await db
      .delete(wallets)
      .where(and(eq(wallets.id, id), eq(wallets.userId, userId)));

    return { success: true };
  }

  static async updateBalance(id: string, userId: string, amount: string, type: "income" | "expense") {
    const wallet = await this.findById(id, userId);
    const currentBalance = parseFloat(wallet.balance);
    const transactionAmount = parseFloat(amount);

    const newBalance = type === "income"
      ? currentBalance + transactionAmount
      : currentBalance - transactionAmount;

    const [updated] = await db
      .update(wallets)
      .set({ balance: newBalance.toFixed(2), updatedAt: new Date() })
      .where(and(eq(wallets.id, id), eq(wallets.userId, userId)))
      .returning();

    return updated;
  }

  static async getTotalBalance(userId: string) {
    const userWallets = await this.findAll(userId);
    const total = userWallets.reduce((sum, wallet) => sum + parseFloat(wallet.balance), 0);
    return { totalBalance: total };
  }

  static async seedDefaultWallets(userId: string) {
    const defaultWallets = [
      { name: "Cash", icon: "💵", color: "#22c55e", balance: "0" },
      { name: "Bank", icon: "🏦", color: "#3b82f6", balance: "0" },
      { name: "E-Wallet", icon: "📱", color: "#8b5cf6", balance: "0" },
    ];

    await db.insert(wallets).values(
      defaultWallets.map(w => ({ ...w, userId }))
    );
  }
}
