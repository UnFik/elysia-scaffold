import { app } from "../src/server";

export async function registerUser(email = "test@example.com", name = "Test User", password = "password123") {
  const response = await app.handle(
    new Request("http://localhost:3001/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, name, password }),
    })
  );
  return response.json();
}

export async function loginUser(email = "test@example.com", password = "password123") {
  const response = await app.handle(
    new Request("http://localhost:3001/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
  );
  return response.json();
}

export async function getAuthToken() {
  const registerResult = await registerUser();
  return registerResult.data.token;
}

export function authHeader(token: string) {
  return {
    "content-type": "application/json",
    "authorization": `Bearer ${token}`,
  };
}
