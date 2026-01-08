import { describe, expect, it } from "bun:test";
import { app } from "../src/server";
import { getAuthToken, authHeader } from "./helpers";

describe("Transactions API", () => {
  async function createWallet(token: string, name = "Test Wallet") {
    const response = await app.handle(
      new Request("http://localhost:3001/api/wallets", {
        method: "POST",
        headers: authHeader(token),
        body: JSON.stringify({ name, balance: "1000000" }),
      })
    );
    const result = await response.json();
    return result.data;
  }

  async function createCategory(token: string, name = "Test Category", type = "expense") {
    const response = await app.handle(
      new Request("http://localhost:3001/api/categories", {
        method: "POST",
        headers: authHeader(token),
        body: JSON.stringify({ name, type }),
      })
    );
    const result = await response.json();
    return result.data;
  }

  it("should create a new transaction", async () => {
    const token = await getAuthToken();
    const wallet = await createWallet(token);
    const category = await createCategory(token);

    const response = await app.handle(
      new Request("http://localhost:3001/api/transactions", {
        method: "POST",
        headers: authHeader(token),
        body: JSON.stringify({
          type: "expense",
          amount: "50000",
          walletId: wallet.id,
          categoryId: category.id,
          description: "Lunch",
        }),
      })
    );

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.data.type).toBe("expense");
    expect(result.data.amount).toBe("50000.00");
    expect(result.data.description).toBe("Lunch");
    expect(result.data.wallet.id).toBe(wallet.id);
    expect(result.data.category.id).toBe(category.id);
  });

  it("should update wallet balance on transaction create", async () => {
    const token = await getAuthToken();
    const wallet = await createWallet(token);

    await app.handle(
      new Request("http://localhost:3001/api/transactions", {
        method: "POST",
        headers: authHeader(token),
        body: JSON.stringify({
          type: "expense",
          amount: "100000",
          walletId: wallet.id,
        }),
      })
    );

    const walletResponse = await app.handle(
      new Request(`http://localhost:3001/api/wallets/${wallet.id}`, {
        method: "GET",
        headers: authHeader(token),
      })
    );
    const walletResult = await walletResponse.json();
    expect(walletResult.data.balance).toBe("900000.00");
  });

  it("should list transactions with pagination", async () => {
    const token = await getAuthToken();

    for (let i = 0; i < 5; i++) {
      await app.handle(
        new Request("http://localhost:3001/api/transactions", {
          method: "POST",
          headers: authHeader(token),
          body: JSON.stringify({
            type: "expense",
            amount: "10000",
            description: `Transaction ${i + 1}`,
          }),
        })
      );
    }

    const response = await app.handle(
      new Request("http://localhost:3001/api/transactions?page=1&limit=3", {
        method: "GET",
        headers: authHeader(token),
      })
    );

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.data.length).toBe(3);
    expect(result.pagination.total).toBe(5);
    expect(result.pagination.totalPages).toBe(2);
  });

  it("should filter transactions by type", async () => {
    const token = await getAuthToken();

    await app.handle(
      new Request("http://localhost:3001/api/transactions", {
        method: "POST",
        headers: authHeader(token),
        body: JSON.stringify({ type: "expense", amount: "50000" }),
      })
    );

    await app.handle(
      new Request("http://localhost:3001/api/transactions", {
        method: "POST",
        headers: authHeader(token),
        body: JSON.stringify({ type: "income", amount: "100000" }),
      })
    );

    const response = await app.handle(
      new Request("http://localhost:3001/api/transactions?type=income", {
        method: "GET",
        headers: authHeader(token),
      })
    );

    const result = await response.json();
    expect(result.data.length).toBe(1);
    expect(result.data[0].type).toBe("income");
  });

  it("should get transaction by id", async () => {
    const token = await getAuthToken();

    const createResponse = await app.handle(
      new Request("http://localhost:3001/api/transactions", {
        method: "POST",
        headers: authHeader(token),
        body: JSON.stringify({
          type: "expense",
          amount: "25000",
          description: "Coffee",
        }),
      })
    );
    const { data: transaction } = await createResponse.json();

    const response = await app.handle(
      new Request(`http://localhost:3001/api/transactions/${transaction.id}`, {
        method: "GET",
        headers: authHeader(token),
      })
    );

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.data.id).toBe(transaction.id);
    expect(result.data.description).toBe("Coffee");
  });

  it("should update transaction", async () => {
    const token = await getAuthToken();

    const createResponse = await app.handle(
      new Request("http://localhost:3001/api/transactions", {
        method: "POST",
        headers: authHeader(token),
        body: JSON.stringify({
          type: "expense",
          amount: "50000",
          description: "Old description",
        }),
      })
    );
    const { data: transaction } = await createResponse.json();

    const response = await app.handle(
      new Request(`http://localhost:3001/api/transactions/${transaction.id}`, {
        method: "PUT",
        headers: authHeader(token),
        body: JSON.stringify({
          amount: "75000",
          description: "New description",
        }),
      })
    );

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.data.amount).toBe("75000.00");
    expect(result.data.description).toBe("New description");
  });

  it("should delete transaction", async () => {
    const token = await getAuthToken();

    const createResponse = await app.handle(
      new Request("http://localhost:3001/api/transactions", {
        method: "POST",
        headers: authHeader(token),
        body: JSON.stringify({
          type: "expense",
          amount: "30000",
        }),
      })
    );
    const { data: transaction } = await createResponse.json();

    const response = await app.handle(
      new Request(`http://localhost:3001/api/transactions/${transaction.id}`, {
        method: "DELETE",
        headers: authHeader(token),
      })
    );

    expect(response.status).toBe(200);

    const getResponse = await app.handle(
      new Request(`http://localhost:3001/api/transactions/${transaction.id}`, {
        method: "GET",
        headers: authHeader(token),
      })
    );
    expect(getResponse.status).toBe(404);
  });

  it("should restore wallet balance on transaction delete", async () => {
    const token = await getAuthToken();
    const wallet = await createWallet(token);

    const createResponse = await app.handle(
      new Request("http://localhost:3001/api/transactions", {
        method: "POST",
        headers: authHeader(token),
        body: JSON.stringify({
          type: "expense",
          amount: "200000",
          walletId: wallet.id,
        }),
      })
    );
    const { data: transaction } = await createResponse.json();

    await app.handle(
      new Request(`http://localhost:3001/api/transactions/${transaction.id}`, {
        method: "DELETE",
        headers: authHeader(token),
      })
    );

    const walletResponse = await app.handle(
      new Request(`http://localhost:3001/api/wallets/${wallet.id}`, {
        method: "GET",
        headers: authHeader(token),
      })
    );
    const walletResult = await walletResponse.json();
    expect(walletResult.data.balance).toBe("1000000.00");
  });

  it("should get summary", async () => {
    const token = await getAuthToken();

    await app.handle(
      new Request("http://localhost:3001/api/transactions", {
        method: "POST",
        headers: authHeader(token),
        body: JSON.stringify({ type: "income", amount: "1000000" }),
      })
    );

    await app.handle(
      new Request("http://localhost:3001/api/transactions", {
        method: "POST",
        headers: authHeader(token),
        body: JSON.stringify({ type: "expense", amount: "300000" }),
      })
    );

    await app.handle(
      new Request("http://localhost:3001/api/transactions", {
        method: "POST",
        headers: authHeader(token),
        body: JSON.stringify({ type: "expense", amount: "200000" }),
      })
    );

    const response = await app.handle(
      new Request("http://localhost:3001/api/transactions/summary", {
        method: "GET",
        headers: authHeader(token),
      })
    );

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.data.totalIncome).toBe(1000000);
    expect(result.data.totalExpense).toBe(500000);
    expect(result.data.balance).toBe(500000);
  });

  it("should get transactions by category", async () => {
    const token = await getAuthToken();
    const category = await createCategory(token, "Food");

    await app.handle(
      new Request("http://localhost:3001/api/transactions", {
        method: "POST",
        headers: authHeader(token),
        body: JSON.stringify({
          type: "expense",
          amount: "50000",
          categoryId: category.id,
        }),
      })
    );

    await app.handle(
      new Request("http://localhost:3001/api/transactions", {
        method: "POST",
        headers: authHeader(token),
        body: JSON.stringify({
          type: "expense",
          amount: "75000",
          categoryId: category.id,
        }),
      })
    );

    const response = await app.handle(
      new Request("http://localhost:3001/api/transactions/by-category", {
        method: "GET",
        headers: authHeader(token),
      })
    );

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.data.length).toBeGreaterThan(0);
    
    const foodCategory = result.data.find((c: any) => c.categoryName === "Food");
    expect(foodCategory).toBeDefined();
    expect(parseFloat(foodCategory.total)).toBe(125000);
  });

  it("should return 401 without auth token", async () => {
    const response = await app.handle(
      new Request("http://localhost:3001/api/transactions", {
        method: "GET",
        headers: { "content-type": "application/json" },
      })
    );

    expect(response.status).toBe(401);
  });
});
