import { eq, and, gte, lte, desc, sql, sum } from "drizzle-orm";
import { notFound } from "../../common/utils";
import db from "../../db/connection";
import { transactions, categories, wallets } from "../../db/schema";
import type { CreateTransactionBody, UpdateTransactionBody, TransactionQuery } from "./transactions.schema";

export abstract class TransactionService {
  static async findAll(userId: string, query: TransactionQuery) {
    const page = parseInt(query.page || "1");
    const limit = parseInt(query.limit || "20");
    const offset = (page - 1) * limit;

    const conditions = [eq(transactions.userId, userId)];

    if (query.type) {
      conditions.push(eq(transactions.type, query.type));
    }

    if (query.walletId) {
      conditions.push(eq(transactions.walletId, query.walletId));
    }

    if (query.categoryId) {
      conditions.push(eq(transactions.categoryId, query.categoryId));
    }

    if (query.startDate) {
      conditions.push(gte(transactions.date, new Date(query.startDate)));
    }

    if (query.endDate) {
      conditions.push(lte(transactions.date, new Date(query.endDate)));
    }

    const [data, countResult] = await Promise.all([
      db.query.transactions.findMany({
        where: and(...conditions),
        with: { category: true, wallet: true },
        orderBy: desc(transactions.date),
        limit,
        offset,
      }),
      db
        .select({ count: sql<number>`count(*)` })
        .from(transactions)
        .where(and(...conditions)),
    ]);

    const total = Number(countResult[0]?.count || 0);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async findById(id: string, userId: string) {
    const transaction = await db.query.transactions.findFirst({
      where: and(eq(transactions.id, id), eq(transactions.userId, userId)),
      with: { category: true, wallet: true },
    });

    if (!transaction) {
      throw notFound("Transaksi tidak ditemukan");
    }

    return transaction;
  }

  static async create(userId: string, data: CreateTransactionBody) {
    const [transaction] = await db
      .insert(transactions)
      .values({
        userId,
        type: data.type,
        amount: data.amount,
        walletId: data.walletId,
        categoryId: data.categoryId,
        description: data.description,
        date: data.date ? new Date(data.date) : new Date(),
      })
      .returning();

    if (data.walletId) {
      await this.updateWalletBalance(data.walletId, userId, data.amount, data.type);
    }

    return db.query.transactions.findFirst({
      where: eq(transactions.id, transaction.id),
      with: { category: true, wallet: true },
    });
  }

  static async update(id: string, userId: string, data: UpdateTransactionBody) {
    const existing = await this.findById(id, userId);

    const updateData: Record<string, any> = { updatedAt: new Date() };
    
    if (data.type) updateData.type = data.type;
    if (data.amount) updateData.amount = data.amount;
    if (data.walletId !== undefined) updateData.walletId = data.walletId;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.date) updateData.date = new Date(data.date);

    if (existing.walletId && (data.amount || data.type)) {
      const reverseType = existing.type === "income" ? "expense" : "income";
      await this.updateWalletBalance(existing.walletId, userId, existing.amount, reverseType);

      const newWalletId = data.walletId || existing.walletId;
      const newAmount = data.amount || existing.amount;
      const newType = data.type || existing.type;
      await this.updateWalletBalance(newWalletId, userId, newAmount, newType);
    }

    const [updated] = await db
      .update(transactions)
      .set(updateData)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .returning();

    return db.query.transactions.findFirst({
      where: eq(transactions.id, updated.id),
      with: { category: true, wallet: true },
    });
  }

  static async delete(id: string, userId: string) {
    const existing = await this.findById(id, userId);

    if (existing.walletId) {
      const reverseType = existing.type === "income" ? "expense" : "income";
      await this.updateWalletBalance(existing.walletId, userId, existing.amount, reverseType);
    }

    await db
      .delete(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));

    return { success: true };
  }

  static async getSummary(userId: string, startDate?: string, endDate?: string) {
    const conditions = [eq(transactions.userId, userId)];

    if (startDate) {
      conditions.push(gte(transactions.date, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(transactions.date, new Date(endDate)));
    }

    const incomeConditions = [...conditions, eq(transactions.type, "income")];
    const expenseConditions = [...conditions, eq(transactions.type, "expense")];

    const [incomeResult, expenseResult] = await Promise.all([
      db
        .select({ total: sum(transactions.amount) })
        .from(transactions)
        .where(and(...incomeConditions)),
      db
        .select({ total: sum(transactions.amount) })
        .from(transactions)
        .where(and(...expenseConditions)),
    ]);

    const totalIncome = parseFloat(incomeResult[0]?.total || "0");
    const totalExpense = parseFloat(expenseResult[0]?.total || "0");
    const balance = totalIncome - totalExpense;

    return {
      totalIncome,
      totalExpense,
      balance,
    };
  }

  static async getByCategory(userId: string, startDate?: string, endDate?: string) {
    const conditions = [eq(transactions.userId, userId)];

    if (startDate) {
      conditions.push(gte(transactions.date, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(transactions.date, new Date(endDate)));
    }

    const result = await db
      .select({
        categoryId: transactions.categoryId,
        categoryName: categories.name,
        categoryIcon: categories.icon,
        categoryColor: categories.color,
        type: transactions.type,
        total: sum(transactions.amount),
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(and(...conditions))
      .groupBy(
        transactions.categoryId,
        categories.name,
        categories.icon,
        categories.color,
        transactions.type
      );

    return result;
  }

  private static async updateWalletBalance(
    walletId: string,
    userId: string,
    amount: string,
    type: "income" | "expense"
  ) {
    const wallet = await db.query.wallets.findFirst({
      where: and(eq(wallets.id, walletId), eq(wallets.userId, userId)),
    });

    if (!wallet) return;

    const currentBalance = parseFloat(wallet.balance);
    const transactionAmount = parseFloat(amount);

    const newBalance = type === "income"
      ? currentBalance + transactionAmount
      : currentBalance - transactionAmount;

    await db
      .update(wallets)
      .set({ balance: newBalance.toFixed(2), updatedAt: new Date() })
      .where(eq(wallets.id, walletId));
  }
}
