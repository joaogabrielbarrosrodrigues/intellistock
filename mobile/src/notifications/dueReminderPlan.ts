import type { ContaPagar } from "../api/types";

export const DUE_REMINDER_SOURCE = "intellistock.conta-vencimento";
export const DUE_REMINDER_HOUR = 9;
const REMINDER_DAYS = [7, 3, 0] as const;
const MAX_SCHEDULED_REMINDERS = 60;

export type DueReminderPlan = {
  key: string;
  signature: string;
  at: Date;
  title: string;
  body: string;
  accountId: string;
};

export function buildDueReminderPlan(accounts: ContaPagar[], userId: string, now = new Date()): DueReminderPlan[] {
  const plans: DueReminderPlan[] = [];

  for (const account of accounts) {
    if (account.status !== "PENDENTE" && account.status !== "VENCIDA") continue;
    const due = parseLocalDate(account.dataVencimento);
    if (!due) continue;
    const formattedDate = `${String(due.day).padStart(2, "0")}/${String(due.month).padStart(2, "0")}/${due.year}`;

    for (const daysBefore of REMINDER_DAYS) {
      const at = new Date(due.year, due.month - 1, due.day - daysBefore, DUE_REMINDER_HOUR);
      if (at.getTime() <= now.getTime()) continue;

      plans.push({
        key: `${userId}:${account.id}:${account.dataVencimento}:${daysBefore}`,
        signature: JSON.stringify([account.descricao, account.valor]),
        at,
        accountId: account.id,
        title: daysBefore === 0 ? "Conta vence hoje" : "Conta a vencer",
        body: daysBefore === 0
          ? `${account.descricao} vence hoje (${formattedDate}).`
          : `${account.descricao} vence em ${daysBefore} dias (${formattedDate}).`
      });
    }
  }

  return plans
    .sort((a, b) => a.at.getTime() - b.at.getTime() || a.key.localeCompare(b.key))
    .slice(0, MAX_SCHEDULED_REMINDERS);
}

function parseLocalDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return { year, month, day };
}
