import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import type { User } from "../api/types";

const SESSION_KEY = "intellistock.session";

export type StoredSession = { token: string; user: User };

export async function readSession(): Promise<StoredSession | null> {
  const value = await readValue();
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<StoredSession>;
    if (typeof parsed.token !== "string" || !parsed.token || !isStoredUser(parsed.user)) {
      await clearSession();
      return null;
    }
    return parsed as StoredSession;
  } catch {
    await clearSession();
    return null;
  }
}

export async function writeSession(session: StoredSession) {
  const value = JSON.stringify(session);
  if (Platform.OS === "web") {
    getWebStorage()?.setItem(SESSION_KEY, value);
    return;
  }

  if (await SecureStore.isAvailableAsync()) {
    await SecureStore.setItemAsync(SESSION_KEY, value);
  }
}

export async function clearSession() {
  if (Platform.OS === "web") {
    getWebStorage()?.removeItem(SESSION_KEY);
    return;
  }

  if (await SecureStore.isAvailableAsync()) {
    await SecureStore.deleteItemAsync(SESSION_KEY);
  }
}

async function readValue() {
  if (Platform.OS === "web") {
    return getWebStorage()?.getItem(SESSION_KEY) ?? null;
  }

  return (await SecureStore.isAvailableAsync()) ? SecureStore.getItemAsync(SESSION_KEY) : null;
}

function getWebStorage() {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

function isStoredUser(user: unknown): user is User {
  if (!user || typeof user !== "object") return false;
  const candidate = user as Partial<User>;
  return typeof candidate.id === "string" && typeof candidate.nome === "string" && typeof candidate.email === "string";
}
