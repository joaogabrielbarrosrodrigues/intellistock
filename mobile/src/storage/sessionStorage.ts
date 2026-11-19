/**
 * Título: Guarda a sessão (token e usuário) no aparelho
 * Explicação: Módulo que guarda a sessão de login (token e usuário) no aparelho, para o usuário
 *   continuar logado quando fecha e abre o app.
 */
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import type { User } from "../api/types";

const SESSION_KEY = "intellistock.session";
let pendingWrite: Promise<unknown> = Promise.resolve();

export type StoredSession = { token: string; user: User };

/**
 * Título: Lê a sessão salva e confere se ela está inteira
 * Explicação: Usado por AuthContext.
 */
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

/**
 * Título: Grava a sessão
 * Explicação: Usado por AuthContext.
 */
export function writeSession(session: StoredSession) {
  return serializeWrite(async () => {
    const value = JSON.stringify(session);
    if (Platform.OS === "web") {
      getWebStorage()?.setItem(SESSION_KEY, value);
      return;
    }

    if (await SecureStore.isAvailableAsync()) {
      await SecureStore.setItemAsync(SESSION_KEY, value);
    }
  });
}

/**
 * Título: Apaga a sessão
 * Explicação: Usado por AuthContext.
 */
export function clearSession() {
  return serializeWrite(async () => {
    if (Platform.OS === "web") {
      getWebStorage()?.removeItem(SESSION_KEY);
      return;
    }

    if (await SecureStore.isAvailableAsync()) {
      await SecureStore.deleteItemAsync(SESSION_KEY);
    }
  });
}

/**
 * Título: Põe a operação na fila, depois da anterior
 * Explicação: Usada só dentro deste arquivo, por writeSession e clearSession.
 */
function serializeWrite(operation: () => Promise<void>) {
  const result = pendingWrite.then(operation, operation);
  pendingWrite = result.catch(() => undefined);
  return result;
}

/**
 * Título: Lê o texto salvo, do cofre ou do localStorage
 * Explicação: Usada só dentro deste arquivo, por readSession.
 */
async function readValue() {
  if (Platform.OS === "web") {
    return getWebStorage()?.getItem(SESSION_KEY) ?? null;
  }

  return (await SecureStore.isAvailableAsync()) ? SecureStore.getItemAsync(SESSION_KEY) : null;
}

/**
 * Título: Pega o localStorage com segurança (alguns navegadores bloqueiam)
 * Explicação: Usada só dentro deste arquivo, por writeSession, clearSession e readValue.
 */
function getWebStorage() {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

/**
 * Título: Confere se o usuário salvo tem id, nome e e-mail
 * Explicação: Usada só dentro deste arquivo, por readSession.
 */
function isStoredUser(user: unknown): user is User {
  if (!user || typeof user !== "object") return false;
  const candidate = user as Partial<User>;
  return typeof candidate.id === "string" && typeof candidate.nome === "string" && typeof candidate.email === "string";
}
