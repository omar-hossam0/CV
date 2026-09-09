import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../server.js";

describe("Backend Auth Contracts (Integration Tests)", () => {
  it("GET /api/auth/me without Bearer token should return 401 Unauthorized", async () => {
    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(401);
    expect(response.body).toEqual(
      expect.objectContaining({
        success: false,
      })
    );
  });
});
