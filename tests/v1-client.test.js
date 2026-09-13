import { describe, expect, it, vi } from "vitest";
import { createV1Client, resolveV1BaseUrl } from "@/api/v1Client";

function memoryStorage(entries = {}) {
  const values = new Map(Object.entries(entries));
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: (key) => values.delete(key) };
}

function fakeAxios(refreshResponse) {
  const handlers = { request: null, success: null, failure: null };
  const client = vi.fn(async (config) => config);
  client.interceptors = {
    request: { use: (handler) => { handlers.request = handler; } },
    response: { use: (success, failure) => { handlers.success = success; handlers.failure = failure; } },
  };
  return {
    handlers,
    module: { create: vi.fn(() => client), post: vi.fn(() => Promise.resolve(refreshResponse)) },
  };
}

describe("v1 client", () => {
  it("normalizes supported base URL forms", () => {
    expect(resolveV1BaseUrl("/api")).toBe("/api/v1");
    expect(resolveV1BaseUrl("http://localhost:5000/api/")).toBe("http://localhost:5000/api/v1");
    expect(resolveV1BaseUrl("http://localhost:5000/api/v1")).toBe("http://localhost:5000/api/v1");
    expect(resolveV1BaseUrl("http://localhost:5000")).toBe("http://localhost:5000/api/v1");
  });

  it("attaches admin auth and a request id", () => {
    const fake = fakeAxios();
    const storage = memoryStorage({ access_token: "token" });
    createV1Client({ baseURL: "/api/v1", storage, authStore: null, axiosModule: fake.module });
    const config = fake.handlers.request({ headers: {} });
    expect(config.headers.Authorization).toBe("Bearer token");
    expect(config.headers["X-Request-Id"]).toBeTruthy();
  });

  it("shares one refresh request and stores camelCase tokens", async () => {
    const fake = fakeAxios({ data: { ok: true, data: { accessToken: "new-access", refreshToken: "new-refresh" }, meta: {} } });
    const storage = memoryStorage({ refresh_token: "old-refresh" });
    const onAccessToken = vi.fn();
    const api = createV1Client({ baseURL: "/api/v1", storage, authStore: null, axiosModule: fake.module, onAccessToken });
    const [one, two] = await Promise.all([api.refreshAccessTokenOnce(), api.refreshAccessTokenOnce()]);
    expect(one).toBe("new-access");
    expect(two).toBe("new-access");
    expect(fake.module.post).toHaveBeenCalledTimes(1);
    expect(storage.getItem("access_token")).toBe("new-access");
    expect(storage.getItem("refresh_token")).toBe("new-refresh");
    expect(onAccessToken).toHaveBeenCalledWith("new-access");
  });
});
