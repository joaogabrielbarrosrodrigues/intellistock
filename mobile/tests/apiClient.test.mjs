import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { extname } from "node:path";
import { test } from "node:test";
import { AxiosError } from "axios";

// Metro resolve imports TypeScript sem extensão; o runner nativo do Node precisa desta resolução.
const resolver = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith(".") && !extname(specifier)) {
      return nextResolve(`${specifier}.ts`, context);
    }
    return nextResolve(specifier, context);
  }
});
const { api, onUnauthorized, setAuthToken } = await import("../src/api/client.ts");
resolver.deregister();

function unauthorized(config) {
  return new AxiosError("Unauthorized", "ERR_BAD_REQUEST", config, undefined, {
    status: 401,
    statusText: "Unauthorized",
    headers: {},
    data: {},
    config
  });
}

test("uma falha no login sem token não dispara o encerramento de sessão", async () => {
  let logouts = 0;
  const unsubscribe = onUnauthorized(() => { logouts += 1; });
  setAuthToken(null);
  api.defaults.adapter = (config) => Promise.reject(unauthorized(config));
  try {
    await assert.rejects(api.post("/api/auth/login"));
    assert.equal(logouts, 0);
  } finally {
    unsubscribe();
    setAuthToken(null);
  }
});

test("um 401 da sessão atual aciona o logout", async () => {
  let logouts = 0;
  const unsubscribe = onUnauthorized(() => { logouts += 1; setAuthToken(null); });
  setAuthToken("token-atual");
  api.defaults.adapter = (config) => Promise.reject(unauthorized(config));
  try {
    await assert.rejects(api.get("/api/estoque"));
    assert.equal(logouts, 1);
    assert.equal(api.defaults.headers.common.Authorization, undefined);
  } finally {
    unsubscribe();
    setAuthToken(null);
  }
});

test("um 401 atrasado de outra sessão preserva o novo login", async () => {
  let logouts = 0;
  let requestConfig;
  const pendingResponse = Promise.withResolvers();
  const unsubscribe = onUnauthorized(() => { logouts += 1; });
  api.defaults.adapter = (config) => {
    requestConfig = config;
    return pendingResponse.promise;
  };
  setAuthToken("token-antigo");
  const request = api.get("/api/estoque");
  setAuthToken("token-novo");
  pendingResponse.reject(unauthorized(requestConfig));
  try {
    await assert.rejects(request);
    assert.equal(logouts, 0);
    assert.equal(api.defaults.headers.common.Authorization, "Bearer token-novo");
  } finally {
    unsubscribe();
    setAuthToken(null);
  }
});
