import { describe, expect, it } from "bun:test";
import { app } from "../src/server";
import { registerUser, authHeader } from "./helpers";

describe("Auth API", () => {
  it("should register a new user", async () => {
    const response = await app.handle(
      new Request("http://localhost:3001/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "newuser@example.com",
          name: "New User",
          password: "password123",
        }),
      })
    );

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.data.user.email).toBe("newuser@example.com");
    expect(result.data.user.name).toBe("New User");
    expect(result.data.token).toBeDefined();
  });

  it("should login with valid credentials", async () => {
    await registerUser("login@example.com", "Login User", "password123");

    const response = await app.handle(
      new Request("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "login@example.com",
          password: "password123",
        }),
      })
    );

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.data.token).toBeDefined();
  });

  it("should fail login with invalid password", async () => {
    await registerUser("invalid@example.com", "Invalid User", "password123");

    const response = await app.handle(
      new Request("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "invalid@example.com",
          password: "wrongpassword",
        }),
      })
    );

    expect(response.status).not.toBe(200);
  });

  it("should get current user session", async () => {
    const registerResult = await registerUser("session@example.com", "Session User", "password123");
    const token = registerResult.data.token;

    const response = await app.handle(
      new Request("http://localhost:3001/api/auth/session", {
        method: "GET",
        headers: authHeader(token),
      })
    );

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.data.user.email).toBe("session@example.com");
  });

  it("should get current user profile", async () => {
    const registerResult = await registerUser("profile@example.com", "Profile User", "password123");
    const token = registerResult.data.token;

    const response = await app.handle(
      new Request("http://localhost:3001/api/auth/me", {
        method: "GET",
        headers: authHeader(token),
      })
    );

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.data.email).toBe("profile@example.com");
    expect(result.data.name).toBe("Profile User");
  });

  it("should update user profile", async () => {
    const registerResult = await registerUser("update@example.com", "Old Name", "password123");
    const token = registerResult.data.token;

    const response = await app.handle(
      new Request("http://localhost:3001/api/auth/profile", {
        method: "PUT",
        headers: authHeader(token),
        body: JSON.stringify({ name: "New Name" }),
      })
    );

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.data.name).toBe("New Name");
  });

  it("should logout user", async () => {
    const registerResult = await registerUser("logout@example.com", "Logout User", "password123");
    const token = registerResult.data.token;

    const response = await app.handle(
      new Request("http://localhost:3001/api/auth/logout", {
        method: "POST",
        headers: authHeader(token),
      })
    );

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.success).toBe(true);
  });

  it("should return 401 for protected routes without token", async () => {
    const response = await app.handle(
      new Request("http://localhost:3001/api/auth/me", {
        method: "GET",
        headers: { "content-type": "application/json" },
      })
    );

    expect(response.status).toBe(401);
  });
});
