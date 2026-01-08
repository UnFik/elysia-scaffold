import { type Context } from "elysia";
import { status } from "elysia/error";
import { auth } from "./auth";

export async function getAuthUser({ request }: Pick<Context, "request">) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    throw unauthorized("Session tidak valid atau sudah expired");
  }

  return { user: session.user, session: session.session };
}

export function errorResponse(statusCode: number, cause?: any) {
  return status(statusCode, {
    success: false,
    message: cause ? `${cause}` : "Internal server error",
  });
}

export function unauthorized(cause?: any) {
  return status(401, {
    success: false,
    message: cause ? `${cause}` : "Unauthorized",
  });
}

export function unprocessable(cause?: any) {
  return status(422, {
    success: false,
    message: cause ? `${cause}` : "Validation failed",
  });
}

export function notFound(cause?: any) {
  return status(404, {
    success: false,
    message: cause ? `${cause}` : "Resource tidak ditemukan",
  });
}

export function badRequest(cause?: any) {
  return status(400, {
    success: false,
    message: cause ? `${cause}` : "Bad request",
  });
}

export function forbidden(cause?: any) {
  return status(403, {
    success: false,
    message: cause ? `${cause}` : "Forbidden",
  });
}
