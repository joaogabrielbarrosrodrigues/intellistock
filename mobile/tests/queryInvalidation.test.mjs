import assert from "node:assert/strict";
import { test } from "node:test";
import { QueryClient } from "@tanstack/react-query";
import { affectedQueries, invalidateRelatedQueries, queryKeys } from "../src/hooks/queryInvalidation.ts";

test("alterar fornecedor invalida sugestões, inclusive consultas filtradas, sem afetar estoque", async () => {
  const client = new QueryClient();
  const fornecedoresFiltrados = [...queryKeys.fornecedores, "teste"];
  client.setQueryData(queryKeys.reposicoes, [{ fornecedor: { nome: "Antigo" } }]);
  client.setQueryData(fornecedoresFiltrados, []);
  client.setQueryData(queryKeys.estoque, []);

  await invalidateRelatedQueries(client, affectedQueries.fornecedor);

  assert.equal(client.getQueryState(queryKeys.reposicoes).isInvalidated, true);
  assert.equal(client.getQueryState(fornecedoresFiltrados).isInvalidated, true);
  assert.equal(client.getQueryState(queryKeys.estoque).isInvalidated, false);
});

test("movimentar estoque invalida saldo, produtos, histórico e análises", async () => {
  const client = new QueryClient();
  const dependentes = [queryKeys.estoque, queryKeys.produtos, queryKeys.movimentacoes,
    queryKeys.consumo, queryKeys.reposicoes, queryKeys.dashboard];
  for (const key of dependentes) client.setQueryData(key, []);
  client.setQueryData(queryKeys.contas, []);

  await invalidateRelatedQueries(client, affectedQueries.estoque);

  for (const key of dependentes) assert.equal(client.getQueryState(key).isInvalidated, true, key[0]);
  assert.equal(client.getQueryState(queryKeys.contas).isInvalidated, false);
});
