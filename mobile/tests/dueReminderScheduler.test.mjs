import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import * as reminderPlan from "../src/notifications/dueReminderPlan.ts";

// Executa o scheduler real substituindo apenas a API nativa, indisponível no Node.
function loadScheduler(beforeSchedule = async () => {}) {
  const scheduled = new Map();
  let nextId = 0;
  const notifications = {
    setNotificationHandler() {},
    SchedulableTriggerInputTypes: { DATE: "date", TIME_INTERVAL: "timeInterval" },
    async getAllScheduledNotificationsAsync() { return [...scheduled.values()]; },
    async cancelScheduledNotificationAsync(id) { scheduled.delete(id); },
    async scheduleNotificationAsync(request) {
      await beforeSchedule();
      const identifier = String(++nextId);
      scheduled.set(identifier, { identifier, ...request });
      return identifier;
    }
  };
  const source = readFileSync(new URL("../src/notifications/dueReminderScheduler.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  });
  const exports = {};
  runInNewContext(outputText, {
    exports,
    require(name) {
      if (name === "react-native") return { Platform: { OS: "android" } };
      if (name === "expo-notifications") return notifications;
      if (name === "./dueReminderPlan") return reminderPlan;
      throw new Error(`Dependência inesperada: ${name}`);
    }
  });
  return { scheduler: exports, scheduled };
}

const accounts = [{
  id: "conta-1", descricao: "Compra de café", valor: 100,
  status: "PENDENTE", dataVencimento: "2099-12-20"
}];

test("logout cancela avisos de teste e automáticos, preservando notificações de outra origem", async () => {
  const { scheduler, scheduled } = loadScheduler();
  scheduled.set("outro", { identifier: "outro", content: { data: { source: "outro" } } });
  await scheduler.reconcileDueReminders(accounts, "usuario-1");
  await scheduler.sendTestDueReminder(accounts, scheduler.getDueReminderGeneration());
  assert.equal(scheduled.size, 5);
  await scheduler.cancelDueReminders();
  assert.deepEqual([...scheduled.keys()], ["outro"]);
});

test("uma consulta de contas concluída após logout não agenda aviso da sessão antiga", async () => {
  const { scheduler, scheduled } = loadScheduler();
  const generation = scheduler.getDueReminderGeneration();
  await scheduler.cancelDueReminders();
  assert.equal(await scheduler.sendTestDueReminder(accounts, generation), false);
  assert.equal(scheduled.size, 0);
});

test("reconciliar lembretes automáticos preserva o aviso de teste", async () => {
  const { scheduler, scheduled } = loadScheduler();
  await scheduler.sendTestDueReminder(accounts, scheduler.getDueReminderGeneration());
  await scheduler.reconcileDueReminders([], "usuario-1");
  assert.equal(scheduled.size, 1);
});

test("logout espera um agendamento iniciado e também o cancela", async () => {
  let release;
  const paused = new Promise((resolve) => { release = resolve; });
  let started;
  const scheduling = new Promise((resolve) => { started = resolve; });
  const { scheduler, scheduled } = loadScheduler(async () => {
    started();
    await paused;
  });
  const sending = scheduler.sendTestDueReminder(accounts, scheduler.getDueReminderGeneration());
  await scheduling;
  const canceling = scheduler.cancelDueReminders();
  release();
  await Promise.all([sending, canceling]);
  assert.equal(scheduled.size, 0);
});
