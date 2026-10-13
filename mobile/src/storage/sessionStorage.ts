import * as SecureStore from "expo-secure-store";
import type { User } from "../api/types";

const SESSION_KEY = "intellistock.session";

export type StoredSession = { token: string; user: User };

export async function readSession(): Promise<StoredSession | null> {
  const value = await SecureStore.getItemAsync(SESSION_KEY);
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<StoredSession>;
    if (typeof parsed.token !== "string" || !parsed.user) return null;
    return parsed as StoredSession;
  } catch {
    await clearSession();
    return null;
  }
}

export async function writeSession(session: StoredSession) {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  return SecureStore.deleteItemAsync(SESSION_KEY);
}
