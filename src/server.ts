import cors from "@elysiajs/cors";
import swagger from "@elysiajs/swagger";
import { Elysia, ValidationError } from "elysia";
import authController from "./api/auth/auth.controller";
import categoriesController from "./api/categories/categories.controller";
import transactionsController from "./api/transactions/transactions.controller";
import walletsController from "./api/wallets/wallets.controller";
import { unprocessable } from "./common/utils";
import { auth } from "./common/auth";

export const app = new Elysia({ prefix: "/api" })
  .use(cors({
    origin: true,
    credentials: true,
  }))
  .mount(auth.handler)
  .use(
    swagger({
      documentation: {
        info: {
          title: "Finance Tracker API",
          version: "1.0.0",
          description: "API for finance tracker application - recording income and expenses",
        },
        tags: [
          { name: "Auth", description: "Authentication endpoints" },
          { name: "Wallets", description: "User wallets" },
          { name: "Categories", description: "Transaction categories" },
          { name: "Transactions", description: "Financial transactions" },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
              description: "Use token from login response. Format: <token>",
            },
          },
        },
      },
      path: "/swagger",
    })
  )
  .onError(({ set, error }) => {
    set.headers["content-type"] = "application/json";
    if (error instanceof ValidationError) {
      try {
        const parsed = JSON.parse(error.message);
        return unprocessable(
          parsed["errors"]?.map(
            (o: Record<string, string>) =>
              `${o.path}: ${o.message}`
          ).join(", ") || error.message
        );
      } catch (e) {
        return unprocessable(error.message);
      }
    }
  })
  .get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }), {
    detail: {
      tags: ["Health"],
      summary: "Health check endpoint",
    },
  })
  .use(authController)
  .use(walletsController)
  .use(categoriesController)
  .use(transactionsController)
  .listen(Bun.env.PORT || 3001);

export type App = typeof app;
console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
console.log(
  `📚 Swagger docs available at http://${app.server?.hostname}:${app.server?.port}/api/swagger`
);
