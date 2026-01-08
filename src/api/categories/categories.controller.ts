import { Elysia, t } from "elysia";
import { auth } from "../../common/auth";
import { unauthorized } from "../../common/utils";
import { createCategoryBody, updateCategoryBody } from "./categories.schema";
import { CategoryService } from "./categories.service";

const categoriesController = new Elysia({ prefix: "/categories", detail: { tags: ["Categories"] } })
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
        .get("/", async () => {
          const categories = await CategoryService.findAll();
          return {
            success: true,
            data: categories,
          };
        }, {
          detail: {
            summary: "List Categories",
            description: "Get all categories",
          },
        })
        .get(
          "/:id",
          async ({ params }) => {
            const category = await CategoryService.findById(params.id);
            return {
              success: true,
              data: category,
            };
          },
          {
            params: t.Object({ id: t.String() }),
            detail: {
              summary: "Get Category",
              description: "Get category by id",
            },
          }
        )
        .post(
          "/",
          async ({ body }) => {
            const category = await CategoryService.create(body);
            return {
              success: true,
              data: category,
            };
          },
          {
            body: createCategoryBody,
            detail: {
              summary: "Create Category",
              description: "Create new category",
            },
          }
        )
        .put(
          "/:id",
          async ({ params, body }) => {
            const category = await CategoryService.update(params.id, body);
            return {
              success: true,
              data: category,
            };
          },
          {
            params: t.Object({ id: t.String() }),
            body: updateCategoryBody,
            detail: {
              summary: "Update Category",
              description: "Update category data",
            },
          }
        )
        .delete(
          "/:id",
          async ({ params }) => {
            await CategoryService.delete(params.id);
            return {
              success: true,
              message: "Category deleted successfully",
            };
          },
          {
            params: t.Object({ id: t.String() }),
            detail: {
              summary: "Delete Category",
              description: "Delete category",
            },
          }
        )
        .post("/seed", async () => {
          await CategoryService.seedDefaultCategories();
          return {
            success: true,
            message: "Default categories created successfully",
          };
        }, {
          detail: {
            summary: "Seed Default Categories",
            description: "Create default categories (Salary, Food, Transportation, etc)",
          },
        })
  );

export default categoriesController;
