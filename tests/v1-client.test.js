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

  it("wipes stored tokens only when the refresh itself fails with 401", async () => {
    const fake = fakeAxios();
    fake.module.post = vi.fn(() => Promise.reject({ response: { status: 401, data: {} } }));
    const cleared = vi.fn();
    const storage = memoryStorage({ access_token: "old-access", refresh_token: "old-refresh" });
    createV1Client({ baseURL: "/api/v1", storage, authStore: { getState: () => ({ clearAuth: cleared }) }, axiosModule: fake.module });
    await expect(fake.handlers.failure({ response: { status: 401, data: {} }, config: { url: "/admin/bootstrap", headers: {} } })).rejects.toBeTruthy();
    expect(storage.getItem("access_token")).toBeNull();
    expect(storage.getItem("refresh_token")).toBeNull();
    expect(cleared).toHaveBeenCalled();
  });

  it("keeps stored tokens on transient failures", async () => {
    const fake = fakeAxios();
    const cleared = vi.fn();
    const storage = memoryStorage({ access_token: "old-access", refresh_token: "old-refresh" });
    createV1Client({ baseURL: "/api/v1", storage, authStore: { getState: () => ({ clearAuth: cleared }) }, axiosModule: fake.module });
    await expect(fake.handlers.failure({ response: { status: 500, data: {} }, config: { url: "/admin/bootstrap", headers: {} } })).rejects.toBeTruthy();
    await expect(fake.handlers.failure(new Error("offline"))).rejects.toBeTruthy();
    expect(storage.getItem("access_token")).toBe("old-access");
    expect(storage.getItem("refresh_token")).toBe("old-refresh");
    expect(cleared).not.toHaveBeenCalled();
    expect(fake.module.post).not.toHaveBeenCalled();
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
