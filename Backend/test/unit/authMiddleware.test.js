import { describe, it, expect, vi } from "vitest";
import { verifyToken, requireRole } from "../../middleware/authMiddleware.js";

describe("Auth Middleware (Unit Tests)", () => {
  describe("verifyToken", () => {
    it("should return 401 if authorization header is missing", async () => {
      const req = {
        headers: {},
        method: "GET",
        originalUrl: "/api/auth/me",
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      await verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "No token provided. Access denied",
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 if authorization header does not start with Bearer", async () => {
      const req = {
        headers: { authorization: "Basic 12345" },
        method: "GET",
        originalUrl: "/api/auth/me",
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      await verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("requireRole", () => {
    it("should allow access if user role matches allowed roles", () => {
      const req = { user: { role: "admin" } };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      const middleware = requireRole(["admin", "hr"]);
      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
    });

    it("should return 403 if user role does not match allowed roles", () => {
      const req = { user: { role: "candidate" } };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      const middleware = requireRole(["admin", "hr"]);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });
});
