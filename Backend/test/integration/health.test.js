import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../server.js";

describe("Backend Health & Root Endpoints (Integration Tests)", () => {
  it("GET /health should return status 200 and healthy message", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "healthy",
      service: "backend",
    });
  });

  it("GET / should return availableEndpoints map", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("availableEndpoints");
    expect(response.body.availableEndpoints).toHaveProperty("authentication");
    expect(response.body.availableEndpoints).toHaveProperty("jobs");
  });
});
