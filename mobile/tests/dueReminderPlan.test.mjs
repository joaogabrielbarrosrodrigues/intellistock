import assert from "node:assert/strict";
import { test } from "node:test";
import { buildDueReminderPlan } from "../src/notifications/dueReminderPlan.ts";

function account(overrides = {}) {
  return {
    id: "conta-1",
    descricao: "Energia",
    valor: 150,
    status: "PENDENTE",
    dataVencimento: "2026-11-10",
    ...overrides
  };
}

test("agenda 7 dias, 3 dias e o dia do vencimento às 9h locais", () => {
  const plans = buildDueReminderPlan([account()], "usuario-1", new Date(2026, 10, 1));
  assert.deepEqual(plans.map(({ at }) => [at.getFullYear(), at.getMonth() + 1, at.getDate(), at.getHours()]), [
    [2026, 11, 3, 9],
    [2026, 11, 7, 9],
    [2026, 11, 10, 9]
  ]);
});

test("ignora marcos passados, contas quitadas e datas inválidas", () => {
  const plans = buildDueReminderPlan([
    account(),
    account({ id: "paga", status: "PAGA" }),
    account({ id: "cancelada", status: "CANCELADA" }),
    account({ id: "invalida", dataVencimento: "2026-02-30" })
  ], "usuario-1", new Date(2026, 10, 7, 10));
  assert.equal(plans.length, 1);
  assert.equal(plans[0].at.getDate(), 10);
  assert.match(plans[0].body, /vence hoje/);
});

test("uma edição de descrição ou valor altera a assinatura do lembrete", () => {
  const before = buildDueReminderPlan([account()], "usuario-1", new Date(2026, 10, 1));
  const after = buildDueReminderPlan([account({ descricao: "Energia elétrica", valor: 180 })], "usuario-1", new Date(2026, 10, 1));
  assert.equal(before[0].key, after[0].key);
  assert.notEqual(before[0].signature, after[0].signature);
});
