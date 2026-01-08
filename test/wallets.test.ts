import { describe, expect, it } from "bun:test";
import { app } from "../src/server";
import { getAuthToken, authHeader } from "./helpers";

describe("Wallets API", () => {
  it("should create a new wallet", async () => {
    const token = await getAuthToken();

    const response = await app.handle(
      new Request("http://localhost:3001/api/wallets", {
        method: "POST",
        headers: authHeader(token),
        body: JSON.stringify({
          name: "Cash",
          balance: "1000000",
          icon: "💵",
          color: "#22c55e",
        }),
      })
    );

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.data.name).toBe("Cash");
    expect(result.data.balance).toBe("1000000.00");
    expect(result.data.icon).toBe("💵");
    expect(result.data.color).toBe("#22c55e");
  });

  it("should list all wallets", async () => {
    const token = await getAuthToken();

    await app.handle(
      new Request("http://localhost:3001/api/wallets", {
        method: "POST",
        headers: authHeader(token),
        body: JSON.stringify({ name: "Wallet 1" }),
      })
    );

    await app.handle(
      new Request("http://localhost:3001/api/wallets", {
        method: "POST",
        headers: authHeader(token),
        body: JSON.stringify({ name: "Wallet 2" }),
      })
    );

    const response = await app.handle(
      new Request("http://localhost:3001/api/wallets", {
        method: "GET",
        headers: authHeader(token),
      })
    );

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.data.length).toBe(2);
  });

  it("should get wallet by id", async () => {
    const token = await getAuthToken();

    const createResponse = await app.handle(
      new Request("http://localhost:3001/api/wallets", {
        method: "POST",
        headers: authHeader(token),
        body: JSON.stringify({ name: "My Wallet" }),
      })
    );
    const { data: wallet } = await createResponse.json();

    const response = await app.handle(
      new Request(`http://localhost:3001/api/wallets/${wallet.id}`, {
        method: "GET",
        headers: authHeader(token),
      })
    );

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.data.id).toBe(wallet.id);
    expect(result.data.name).toBe("My Wallet");
  });

  it("should update wallet", async () => {
    const token = await getAuthToken();

    const createResponse = await app.handle(
      new Request("http://localhost:3001/api/wallets", {
        method: "POST",
        headers: authHeader(token),
        body: JSON.stringify({ name: "Old Name" }),
      })
    );
    const { data: wallet } = await createResponse.json();

    const response = await app.handle(
      new Request(`http://localhost:3001/api/wallets/${wallet.id}`, {
        method: "PUT",
        headers: authHeader(token),
        body: JSON.stringify({ name: "New Name", balance: "500000" }),
      })
    );

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.data.name).toBe("New Name");
    expect(result.data.balance).toBe("500000.00");
  });

  it("should delete wallet", async () => {
    const token = await getAuthToken();

    const createResponse = await app.handle(
      new Request("http://localhost:3001/api/wallets", {
        method: "POST",
        headers: authHeader(token),
        body: JSON.stringify({ name: "To Delete" }),
      })
    );
    const { data: wallet } = await createResponse.json();

    const response = await app.handle(
      new Request(`http://localhost:3001/api/wallets/${wallet.id}`, {
        method: "DELETE",
        headers: authHeader(token),
      })
    );

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.success).toBe(true);

    const getResponse = await app.handle(
      new Request(`http://localhost:3001/api/wallets/${wallet.id}`, {
        method: "GET",
        headers: authHeader(token),
      })
    );
    expect(getResponse.status).toBe(404);
  });

  it("should get total balance", async () => {
    const token = await getAuthToken();

    await app.handle(
      new Request("http://localhost:3001/api/wallets", {
        method: "POST",
        headers: authHeader(token),
        body: JSON.stringify({ name: "Wallet 1", balance: "1000000" }),
      })
    );

    await app.handle(
      new Request("http://localhost:3001/api/wallets", {
        method: "POST",
        headers: authHeader(token),
        body: JSON.stringify({ name: "Wallet 2", balance: "500000" }),
      })
    );

    const response = await app.handle(
      new Request("http://localhost:3001/api/wallets/total-balance", {
        method: "GET",
        headers: authHeader(token),
      })
    );

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.data.totalBalance).toBe(1500000);
  });

  it("should seed default wallets", async () => {
    const token = await getAuthToken();

    const response = await app.handle(
      new Request("http://localhost:3001/api/wallets/seed", {
        method: "POST",
        headers: authHeader(token),
      })
    );

    expect(response.status).toBe(200);

    const listResponse = await app.handle(
      new Request("http://localhost:3001/api/wallets", {
        method: "GET",
        headers: authHeader(token),
      })
    );

    const result = await listResponse.json();
    expect(result.data.length).toBe(3);
  });

  it("should return 401 without auth token", async () => {
    const response = await app.handle(
      new Request("http://localhost:3001/api/wallets", {
        method: "GET",
        headers: { "content-type": "application/json" },
      })
    );

    expect(response.status).toBe(401);
  });
});
