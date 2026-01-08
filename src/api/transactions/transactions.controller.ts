import { Elysia, t } from "elysia";
import { auth } from "../../common/auth";
import { getAuthUser, unauthorized } from "../../common/utils";
import {
  createTransactionBody,
  updateTransactionBody,
  transactionQuery,
} from "./transactions.schema";
import { TransactionService } from "./transactions.service";

const transactionsController = new Elysia({ prefix: "/transactions", detail: { tags: ["Transactions"] } })
  .guard(
    {
      async beforeHandle({ request }) {
        const session = await auth.api.getSession({
          headers: request.headers,
        });
        if (!session) {
          throw unauthorized();
        }
      },
      detail: {
        security: [{ bearerAuth: [] }],
      },
    },
    app =>
      app
        .resolve(getAuthUser)
        .get(
          "/",
          async ({ user, query }) => {
            const result = await TransactionService.findAll(user.id, query);
            return {
              success: true,
              ...result,
            };
          },
          {
            query: transactionQuery,
            detail: {
              summary: "List Transactions",
              description: "Get transactions with filter and pagination",
            },
          }
        )
        .get(
          "/summary",
          async ({ user, query }) => {
            const summary = await TransactionService.getSummary(
              user.id,
              query.startDate,
              query.endDate
            );
            return {
              success: true,
              data: summary,
            };
          },
          {
            query: t.Object({
              startDate: t.Optional(t.String()),
              endDate: t.Optional(t.String()),
            }),
            detail: {
              summary: "Get Summary",
              description: "Get summary of total income, expense, and balance",
            },
          }
        )
        .get(
          "/by-category",
          async ({ user, query }) => {
            const data = await TransactionService.getByCategory(
              user.id,
              query.startDate,
              query.endDate
            );
            return {
              success: true,
              data,
            };
          },
          {
            query: t.Object({
              startDate: t.Optional(t.String()),
              endDate: t.Optional(t.String()),
            }),
            detail: {
              summary: "Get By Category",
              description: "Get transactions grouped by category",
            },
          }
        )
        .get(
          "/:id",
          async ({ user, params }) => {
            const transaction = await TransactionService.findById(params.id, user.id);
            return {
              success: true,
              data: transaction,
            };
          },
          {
            params: t.Object({ id: t.String() }),
            detail: {
              summary: "Get Transaction",
              description: "Get transaction by id",
            },
          }
        )
        .post(
          "/",
          async ({ user, body }) => {
            const transaction = await TransactionService.create(user.id, body);
            return {
              success: true,
              data: transaction,
            };
          },
          {
            body: createTransactionBody,
            detail: {
              summary: "Create Transaction",
              description: "Create new transaction (income/expense)",
            },
          }
        )
        .put(
          "/:id",
          async ({ user, params, body }) => {
            const transaction = await TransactionService.update(params.id, user.id, body);
            return {
              success: true,
              data: transaction,
            };
          },
          {
            params: t.Object({ id: t.String() }),
            body: updateTransactionBody,
            detail: {
              summary: "Update Transaction",
              description: "Update transaction data",
            },
          }
        )
        .delete(
          "/:id",
          async ({ user, params }) => {
            await TransactionService.delete(params.id, user.id);
            return {
              success: true,
              message: "Transaction deleted successfully",
            };
          },
          {
            params: t.Object({ id: t.String() }),
            detail: {
              summary: "Delete Transaction",
              description: "Delete transaction",
            },
          }
        )
  );

export default transactionsController;
