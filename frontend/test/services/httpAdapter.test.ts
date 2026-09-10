import { afterEach, describe, expect, it, vi } from "vitest";
import { httpBackend } from "@/services/httpAdapter";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("http adapter contract", () => {
  it("accepts a 204 response without attempting to parse JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    globalThis.fetch = fetchMock;

    await expect(httpBackend.deleteTask("task/with space")).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith("/api/status/tasks/task%2Fwith%20space", expect.objectContaining({ method: "DELETE" }));
  });

  it("encodes conversation and agent path parameters", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "conversation" }), { status: 200, headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200, headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } }));
    globalThis.fetch = fetchMock;

    await httpBackend.getConversation("sid/42 with space");
    await httpBackend.getAssistantSuggestions("sid/42 with space");
    await httpBackend.restoreSystemAgentDefault("agent/id with space");

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "/api/conversations/sid%2F42%20with%20space",
      "/api/conversations/sid%2F42%20with%20space/suggestions",
      "/api/agent/system/agent%2Fid%20with%20space/restore",
    ]);
  });

  it("unwraps successful API envelopes and rejects non-zero codes", async () => {
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: 0, msg: "ok", data: { ready: true } }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: 7, msg: "业务失败", data: null }), { status: 200 }));

    await expect(httpBackend.getSelfInfo()).resolves.toEqual({ ready: true });
    await expect(httpBackend.getSelfInfo()).rejects.toThrow("业务失败");
  });
});
