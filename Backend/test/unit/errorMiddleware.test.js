import { describe, it, expect, vi } from "vitest";
import { notFound, errorHandler } from "../../middleware/errorMiddleware.js";

describe("Error Middleware (Unit Tests)", () => {
  it("notFound should create 404 Error and pass to next()", () => {
    const req = { originalUrl: "/api/unknown-endpoint" };
    const res = {
      status: vi.fn(),
    };
    const next = vi.fn();

    notFound(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).toHaveBeenCalledTimes(1);
    const passedError = next.mock.calls[0][0];
    expect(passedError).toBeInstanceOf(Error);
    expect(passedError.message).toContain("Not Found - /api/unknown-endpoint");
  });

  it("errorHandler should format CastError as 404", () => {
    const err = { name: "CastError", message: "Cast to ObjectId failed" };
    const req = {};
    const res = {
      statusCode: 500,
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Resource not found",
      })
    );
  });

  it("errorHandler should format JsonWebTokenError as 401", () => {
    const err = { name: "JsonWebTokenError", message: "invalid signature" };
    const req = {};
    const res = {
      statusCode: 500,
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Invalid token",
      })
    );
  });
});
