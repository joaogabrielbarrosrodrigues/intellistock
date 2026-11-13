import { Platform } from "react-native";
import type { ContaPagar } from "../api/types";
import { buildDueReminderPlan, buildTestReminderBody, DUE_REMINDER_SOURCE } from "./dueReminderPlan";

const CHANNEL_ID = "contas-vencimento";
const TEST_REMINDER_SOURCE = "intellistock.conta-vencimento-teste";
let pendingOperation: Promise<unknown> = Promise.resolve();
let notificationsModule: Promise<typeof import("expo-notifications")> | null = null;
let reminderGeneration = 0;

// Capture antes de buscar contas: sair invalida também solicitações ainda em andamento.
export function getDueReminderGeneration() {
  return reminderGeneration;
}

async function getNotifications() {
  notificationsModule ??= import("expo-notifications").then((Notifications) => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false
      })
    });
    return Notifications;
  });
  return notificationsModule;
}

function serialize<T>(operation: () => Promise<T>): Promise<T> {
  const result = pendingOperation.then(operation, operation);
  pendingOperation = result.then(() => undefined, () => undefined);
  return result;
}

export async function checkDueReminderPermission(requestIfUndetermined: boolean) {
  if (Platform.OS === "web") return false;
  const Notifications = await getNotifications();
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Vencimento de contas",
      importance: Notifications.AndroidImportance.HIGH
    });
  }
  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted && requestIfUndetermined && permission.status === "undetermined") {
    permission = await Notifications.requestPermissionsAsync();
  }
  return permission.granted;
}

export function reconcileDueReminders(accounts: ContaPagar[], userId: string) {
  if (Platform.OS === "web") return Promise.resolve();
  const generation = reminderGeneration;
  return serialize(async () => {
    const Notifications = await getNotifications();
    if (generation !== reminderGeneration) return;
    const desired = new Map(buildDueReminderPlan(accounts, userId).map((plan) => [plan.key, plan]));
    const existing = await Notifications.getAllScheduledNotificationsAsync();

    for (const reminder of existing) {
      const data = reminder.content.data;
      if (data?.source !== DUE_REMINDER_SOURCE) continue;
      const key = typeof data.key === "string" ? data.key : "";
      const plan = desired.get(key);
      if (plan && data.signature === plan.signature && data.at === plan.at.getTime()) {
        desired.delete(key);
      } else {
        await Notifications.cancelScheduledNotificationAsync(reminder.identifier);
      }
    }

    for (const plan of desired.values()) {
      if (generation !== reminderGeneration) return;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: plan.title,
          body: plan.body,
          sound: "default",
          data: {
            source: DUE_REMINDER_SOURCE,
            key: plan.key,
            signature: plan.signature,
            at: plan.at.getTime(),
            accountId: plan.accountId
          }
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: plan.at,
          ...(Platform.OS === "android" ? { channelId: CHANNEL_ID } : {})
        }
      });
    }
  });
}

export function cancelDueReminders() {
  reminderGeneration += 1;
  if (Platform.OS === "web") return Promise.resolve();
  return serialize(async () => {
    const Notifications = await getNotifications();
    const existing = await Notifications.getAllScheduledNotificationsAsync();
    for (const reminder of existing) {
      if (reminder.content.data?.source === DUE_REMINDER_SOURCE
          || reminder.content.data?.source === TEST_REMINDER_SOURCE) {
        await Notifications.cancelScheduledNotificationAsync(reminder.identifier);
      }
    }
  });
}

export function sendTestDueReminder(accounts: ContaPagar[], generation: number): Promise<boolean> {
  if (Platform.OS === "web") return Promise.resolve(false);
  return serialize(async () => {
    const Notifications = await getNotifications();
    if (generation !== reminderGeneration) return false;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Aviso de teste",
        body: buildTestReminderBody(accounts),
        sound: "default",
        data: { source: TEST_REMINDER_SOURCE }
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5,
        ...(Platform.OS === "android" ? { channelId: CHANNEL_ID } : {})
      }
    });
    return true;
  });
}
