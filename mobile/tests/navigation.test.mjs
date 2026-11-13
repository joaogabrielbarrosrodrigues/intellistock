import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { getPathFromState, getStateFromPath } from "@react-navigation/core";
import { CommonActions, StackRouter, TabRouter } from "@react-navigation/routers";
import ts from "typescript";

// Exercise the real URL configuration without loading native modules in Node.
const source = readFileSync(new URL("../src/navigation/linking.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS }
}).outputText;
const exported = {};
new Function("require", "exports", compiled)((name) => {
  assert.equal(name, "react-native");
  return { Platform: { OS: "web" } };
}, exported);
const { config } = exported.linking;

function options(routeNames) {
  return { routeNames, routeParamList: {}, routeGetIdList: {} };
}

test("URLs de fornecedores e análises mantêm o menu na pilha para voltar", () => {
  const router = StackRouter({ initialRouteName: "Menu" });
  const routeOptions = options(["Menu", "Fornecedores", "Analises"]);

  for (const [path, name] of [["/mais/fornecedores", "Fornecedores"], ["/mais/analises", "Analises"]]) {
    const parsed = getStateFromPath(path, config);
    assert.equal(getPathFromState(parsed, config), path);
    const nested = parsed.routes.find((route) => route.name === "Mais").state;
    const state = router.getRehydratedState(nested, routeOptions);
    assert.equal(state.routes[state.index].name, name);
    const previous = router.getStateForAction(state, CommonActions.goBack(), routeOptions);
    assert.equal(previous.routes[previous.index].name, "Menu");
  }
});

test("estado de URL autenticada é descartado pelo navegador de login após sair", () => {
  const protectedState = getStateFromPath("/mais/fornecedores", config);
  const authRouter = StackRouter({ initialRouteName: "Login" });
  const authOptions = options(["Login", "Register"]);
  const loggedOut = authRouter.getRehydratedState(protectedState, authOptions);
  assert.deepEqual(loggedOut.routes.map((route) => route.name), ["Login"]);

  const tabs = TabRouter({ initialRouteName: "Dashboard" });
  const authenticated = tabs.getRehydratedState({ ...loggedOut, stale: true },
    options(["Dashboard", "Produtos", "Estoque", "Contas", "Mais"]));
  assert.equal(authenticated.routes[authenticated.index].name, "Dashboard");
});

test("URL inicial de cadastro continua apontando para a tela de cadastro", () => {
  const state = getStateFromPath("/cadastro", config);
  assert.equal(state.routes[state.index ?? 0].name, "Register");
});
