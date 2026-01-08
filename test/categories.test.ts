import { describe, expect, it } from "bun:test";
import { app } from "../src/server";
import { getAuthToken, authHeader } from "./helpers";

describe("Categories API", () => {
  it("should create a new category", async () => {
    const token = await getAuthToken();

    const response = await app.handle(
      new Request("http://localhost:3001/api/categories", {
        method: "POST",
        headers: authHeader(token),
        body: JSON.stringify({
          name: "Food",
          icon: "🍔",
          color: "#ef4444",
          type: "expense",
        }),
      })
    );

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.data.name).toBe("Food");
    expect(result.data.icon).toBe("🍔");
    expect(result.data.color).toBe("#ef4444");
    expect(result.data.type).toBe("expense");
  });

  it("should list all categories", async () => {
    const token = await getAuthToken();

    await app.handle(
      new Request("http://localhost:3001/api/categories", {
        method: "POST",
        headers: authHeader(token),
        body: JSON.stringify({ name: "Food", type: "expense" }),
      })
    );

    await app.handle(
      new Request("http://localhost:3001/api/categories", {
        method: "POST",
        headers: authHeader(token),
        body: JSON.stringify({ name: "Salary", type: "income" }),
      })
    );

    const response = await app.handle(
      new Request("http://localhost:3001/api/categories", {
        method: "GET",
        headers: authHeader(token),
      })
    );

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.data.length).toBe(2);
  });

  it("should get category by id", async () => {
    const token = await getAuthToken();

    const createResponse = await app.handle(
      new Request("http://localhost:3001/api/categories", {
        method: "POST",
        headers: authHeader(token),
        body: JSON.stringify({ name: "Transport", type: "expense" }),
      })
    );
    const { data: category } = await createResponse.json();

    const response = await app.handle(
      new Request(`http://localhost:3001/api/categories/${category.id}`, {
        method: "GET",
        headers: authHeader(token),
      })
    );

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.data.id).toBe(category.id);
    expect(result.data.name).toBe("Transport");
  });

  it("should update category", async () => {
    const token = await getAuthToken();

    const createResponse = await app.handle(
      new Request("http://localhost:3001/api/categories", {
        method: "POST",
        headers: authHeader(token),
        body: JSON.stringify({ name: "Old Name", type: "expense" }),
      })
    );
    const { data: category } = await createResponse.json();

    const response = await app.handle(
      new Request(`http://localhost:3001/api/categories/${category.id}`, {
        method: "PUT",
        headers: authHeader(token),
        body: JSON.stringify({ name: "New Name", icon: "🎯" }),
      })
    );

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.data.name).toBe("New Name");
    expect(result.data.icon).toBe("🎯");
  });

  it("should delete category", async () => {
    const token = await getAuthToken();

    const createResponse = await app.handle(
      new Request("http://localhost:3001/api/categories", {
        method: "POST",
        headers: authHeader(token),
        body: JSON.stringify({ name: "To Delete", type: "expense" }),
      })
    );
    const { data: category } = await createResponse.json();

    const response = await app.handle(
      new Request(`http://localhost:3001/api/categories/${category.id}`, {
        method: "DELETE",
        headers: authHeader(token),
      })
    );

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.success).toBe(true);

    const getResponse = await app.handle(
      new Request(`http://localhost:3001/api/categories/${category.id}`, {
        method: "GET",
        headers: authHeader(token),
      })
    );
    expect(getResponse.status).toBe(404);
  });

  it("should seed default categories", async () => {
    const token = await getAuthToken();

    const response = await app.handle(
      new Request("http://localhost:3001/api/categories/seed", {
        method: "POST",
        headers: authHeader(token),
      })
    );

    expect(response.status).toBe(200);

    const listResponse = await app.handle(
      new Request("http://localhost:3001/api/categories", {
        method: "GET",
        headers: authHeader(token),
      })
    );

    const result = await listResponse.json();
    expect(result.data.length).toBe(10);
  });

  it("should return 401 without auth token", async () => {
    const response = await app.handle(
      new Request("http://localhost:3001/api/categories", {
        method: "GET",
        headers: { "content-type": "application/json" },
      })
    );

    expect(response.status).toBe(401);
  });
});
