import { describe, it, expect, beforeEach, vi } from "vitest";
import { getApiUrl, apiRequest, getFileBaseUrl } from "../../utils/api.js";

describe("Frontend API Utilities (Unit Tests)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe("getApiUrl", () => {
    it("should prepend /api when not present", () => {
      const url = getApiUrl("auth/login");
      expect(url).toBe("/api/auth/login");
    });

    it("should retain /api if already present", () => {
      const url = getApiUrl("/api/jobs");
      expect(url).toBe("/api/jobs");
    });

    it("should return absolute http/https URLs as-is", () => {
      expect(getApiUrl("https://example.com/api/test")).toBe("https://example.com/api/test");
      expect(getApiUrl("http://localhost:5000/health")).toBe("http://localhost:5000/health");
    });
  });

  describe("apiRequest", () => {
    it("should include Authorization header when token exists in localStorage", async () => {
      localStorage.setItem("token", "fake-jwt-token-123");

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: {
          get: () => "application/json",
        },
        json: async () => ({ success: true, data: [] }),
      });
      global.fetch = mockFetch;

      const result = await apiRequest("/jobs");

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[0]).toBe("/api/jobs");
      expect(callArgs[1].headers["Authorization"]).toBe("Bearer fake-jwt-token-123");
      expect(result).toEqual({ success: true, data: [] });
    });

    it("should throw error object if response is not ok", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        headers: {
          get: () => "application/json",
        },
        json: async () => ({ success: false, message: "Unauthorized access" }),
      });
      global.fetch = mockFetch;

      await expect(apiRequest("/auth/me")).rejects.toEqual({
        status: 401,
        success: false,
        message: "Unauthorized access",
      });
    });
  });

  describe("getFileBaseUrl", () => {
    it("should return a string value", () => {
      expect(typeof getFileBaseUrl()).toBe("string");
    });
  });
});
