import { describe, expect, it, vi } from "vitest";
import { generateScriptHandler, generateSpeechHandler, papersHandler } from "./handlers.js";

describe("request validation responses", () => {
  it.each([
    ["paper search", papersHandler],
    ["script generation", generateScriptHandler],
    ["speech generation", generateSpeechHandler],
  ])("preserves structured validation details for %s", async (_name, handler) => {
    const response = { status: vi.fn(), json: vi.fn(), setHeader: vi.fn() };
    response.status.mockReturnValue(response);
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await handler({ method: "POST", headers: {}, body: {} }, response);
      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.json).toHaveBeenCalledWith({
        error: "Invalid input",
        details: expect.arrayContaining([
          expect.objectContaining({ path: expect.any(Array), message: expect.any(String) }),
        ]),
      });
    } finally {
      errorLog.mockRestore();
    }
  });
});
