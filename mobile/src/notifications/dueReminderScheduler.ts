import { Platform } from "react-native";
import type { ContaPagar } from "../api/types";
import { buildDueReminderPlan, DUE_REMINDER_SOURCE } from "./dueReminderPlan";

const CHANNEL_ID = "contas-vencimento";
let pendingOperation: Promise<unknown> = Promise.resolve();
let notificationsModule: Promise<typeof import("expo-notifications")> | null = null;

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
  return serialize(async () => {
    const Notifications = await getNotifications();
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
  if (Platform.OS === "web") return Promise.resolve();
  return serialize(async () => {
    const Notifications = await getNotifications();
    const existing = await Notifications.getAllScheduledNotificationsAsync();
    for (const reminder of existing) {
      if (reminder.content.data?.source === DUE_REMINDER_SOURCE) {
        await Notifications.cancelScheduledNotificationAsync(reminder.identifier);
      }
    }
  });
}

export async function sendTestDueReminder() {
  if (Platform.OS === "web") return;
  const Notifications = await getNotifications();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Aviso de teste",
      body: "Os lembretes de contas estão funcionando neste aparelho.",
      sound: "default"
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
      ...(Platform.OS === "android" ? { channelId: CHANNEL_ID } : {})
    }
  });
}
