import { Elysia, t } from "elysia";
import { auth } from "../../common/auth";
import { getAuthUser, unauthorized } from "../../common/utils";
import { createWalletBody, updateWalletBody } from "./wallets.schema";
import { WalletService } from "./wallets.service";

const walletsController = new Elysia({ prefix: "/wallets", detail: { tags: ["Wallets"] } })
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
        .get("/", async ({ user }) => {
          const wallets = await WalletService.findAll(user.id);
          return {
            success: true,
            data: wallets,
          };
        }, {
          detail: {
            summary: "List Wallets",
            description: "Get all user wallets",
          },
        })
        .get("/total-balance", async ({ user }) => {
          const result = await WalletService.getTotalBalance(user.id);
          return {
            success: true,
            data: result,
          };
        }, {
          detail: {
            summary: "Get Total Balance",
            description: "Get total balance from all wallets",
          },
        })
        .get(
          "/:id",
          async ({ user, params }) => {
            const wallet = await WalletService.findById(params.id, user.id);
            return {
              success: true,
              data: wallet,
            };
          },
          {
            params: t.Object({ id: t.String() }),
            detail: {
              summary: "Get Wallet",
              description: "Get wallet detail by ID",
            },
          }
        )
        .post(
          "/",
          async ({ user, body }) => {
            const wallet = await WalletService.create(user.id, body);
            return {
              success: true,
              data: wallet,
            };
          },
          {
            body: createWalletBody,
            detail: {
              summary: "Create Wallet",
              description: "Create new wallet",
            },
          }
        )
        .put(
          "/:id",
          async ({ user, params, body }) => {
            const wallet = await WalletService.update(params.id, user.id, body);
            return {
              success: true,
              data: wallet,
            };
          },
          {
            params: t.Object({ id: t.String() }),
            body: updateWalletBody,
            detail: {
              summary: "Update Wallet",
              description: "Update wallet data",
            },
          }
        )
        .delete(
          "/:id",
          async ({ user, params }) => {
            await WalletService.delete(params.id, user.id);
            return {
              success: true,
              message: "Wallet deleted successfully",
            };
          },
          {
            params: t.Object({ id: t.String() }),
            detail: {
              summary: "Delete Wallet",
              description: "Delete wallet",
            },
          }
        )
        .post("/seed", async ({ user }) => {
          await WalletService.seedDefaultWallets(user.id);
          return {
            success: true,
            message: "Default wallets created successfully",
          };
        }, {
          detail: {
            summary: "Seed Default Wallets",
            description: "Create default wallets (Cash, Bank, E-Wallet)",
            responses: {
              '200': {
                content: {
                  'application/json': {
                    schema: t.Object({
                      success: t.Boolean(),
                      message: t.String(),
                    }),
                  },
                },
                description: "Default wallets created successfully",
              },
            }
          },
        })
  );

export default walletsController;
