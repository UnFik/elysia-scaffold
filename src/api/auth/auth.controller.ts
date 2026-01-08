import { Elysia, t } from "elysia";
import { auth } from "../../common/auth";
import { errorResponse, getAuthUser, unauthorized } from "../../common/utils";

const authController = new Elysia({ prefix: "/auth", detail: { tags: ["Auth"] } })
  .post(
    "/register",
    async ({ body, request }) => {
      const result = await auth.api.signUpEmail({
        body: {
          email: body.email,
          password: body.password,
          name: body.name,
        },
        headers: request.headers,
      });

      return {
        success: true,
        data: result,
      };
    },
    {
      body: t.Object({
        email: t.String({
          format: "email",
          default: "john@example.com",
        }),
        name: t.String({
          minLength: 2,
          default: "John Doe",
        }),
        password: t.String({
          minLength: 6,
          default: "password123",
        }),
      }),
      detail: {
        summary: "Register",
        description: "Register new user with email and password",
      },
    }
  )
  .post(
    "/login",
    async ({ body, request }) => {
      const result = await auth.api.signInEmail({
        body: {
          email: body.email,
          password: body.password,
        },
        headers: request.headers,
      }).catch(error => {
        throw errorResponse(error.statusCode, error.message)
      });

      return {
        success: true,
        data: result,
      };
    },
    {
      body: t.Object({
        email: t.String({
          format: "email",
          default: "john@example.com",
        }),
        password: t.String({
          minLength: 1,
          default: "password123",
        }),
      }),
      detail: {
        summary: "Login",
        description: "Login with email and password. Token returned in 'token' field.",
      },
    }
  )
  .get(
    "/session",
    async ({ request }) => {
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session) {
        throw unauthorized("Session not found");
      }

      return {
        success: true,
        data: session,
      };
    },
    {
      detail: {
        summary: "Get Session",
        description: "Get current session. Use header: Authorization: Bearer <token>",
        security: [{ bearerAuth: [] }],
      },
    }
  )
  .guard(
    {
      async beforeHandle({ request }) {
        const session = await auth.api.getSession({
          headers: request.headers,
        });
        if (!session) {
          throw unauthorized("Unauthorized. Use header: Authorization: Bearer <token>");
        }
      },
      detail: {
        security: [{ bearerAuth: [] }],
      },
    },
    app =>
      app
        .resolve(getAuthUser)
        .get("/me", async ({ user }) => {
          return {
            success: true,
            data: {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
              emailVerified: user.emailVerified,
              createdAt: user.createdAt,
            },
          };
        }, {
          detail: {
            summary: "Get Current User",
            description: "Get current user data",
          },
        })
        .post("/logout", async ({ request }) => {
          await auth.api.signOut({
            headers: request.headers,
          });

          return {
            success: true,
            message: "Success logout",
          };
        }, {
          detail: {
            summary: "Logout",
            description: "Logout from current session",
          },
        })
        .get("/sessions", async ({ request }) => {
          const sessions = await auth.api.listSessions({
            headers: request.headers,
          });

          return {
            success: true,
            data: sessions,
          };
        }, {
          detail: {
            summary: "List Sessions",
            description: "Get all active user sessions",
          },
        })
        .post("/revoke-sessions", async ({ request }) => {
          await auth.api.revokeOtherSessions({
            headers: request.headers,
          });

          return {
            success: true,
            message: "All other sessions revoked successfully",
          };
        }, {
          detail: {
            summary: "Revoke Other Sessions",
            description: "Revoke all sessions except current session",
          },
        })
        .put(
          "/profile",
          async ({ body, request }) => {
            const updated = await auth.api.updateUser({
              body,
              headers: request.headers,
            });

            return {
              success: true,
              data: updated,
            };
          },
          {
            body: t.Partial(
              t.Object({
                name: t.String({ minLength: 2 }),
                image: t.String(),
              })
            ),
            detail: {
              summary: "Update Profile",
              description: "Update name or image user",
            },
          }
        )
        .post(
          "/change-password",
          async ({ body, request }) => {
            await auth.api.changePassword({
              body: {
                currentPassword: body.currentPassword,
                newPassword: body.newPassword,
              },
              headers: request.headers,
            });

            return {
              success: true,
              message: "Password changed successfully",
            };
          },
          {
            body: t.Object({
              currentPassword: t.String({ minLength: 1 }),
              newPassword: t.String({ minLength: 6 }),
            }),
            detail: {
              summary: "Change Password",
              description: "Change user password",
            },
          }
        )
  );

export default authController;
