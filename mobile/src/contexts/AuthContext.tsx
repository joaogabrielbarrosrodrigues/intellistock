import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { login as loginRequest } from "../api/intellistock";
import { onUnauthorized, setAuthToken } from "../api/client";
import type { User } from "../api/types";
import { cancelDueReminders } from "../notifications/dueReminderScheduler";
import { clearSession, readSession, writeSession } from "../storage/sessionStorage";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, senha: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStoredSession() {
      try {
        const session = await readSession();
        if (session) {
          setAuthToken(session.token);
          setToken(session.token);
          setUser(session.user);
        }
      } catch {
        setAuthToken(null);
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadStoredSession();
  }, []);

  const signOut = useCallback(async () => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
    queryClient.clear();
    // Falhas do aparelho não podem impedir a saída nem gerar uma rejeição sem tratamento.
    await Promise.allSettled([clearSession(), cancelDueReminders()]);
  }, [queryClient]);

  useEffect(() => onUnauthorized(() => void signOut()), [signOut]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      async signIn(email, senha) {
        const response = await loginRequest(email.trim(), senha);
        try {
          await writeSession({ token: response.token, user: response.user });
        } catch {
          // O login continua válido em memória se o armazenamento estiver indisponível.
        }
        queryClient.clear();
        setAuthToken(response.token);
        setToken(response.token);
        setUser(response.user);
      },
      signOut
    }),
    [loading, queryClient, signOut, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  }
  return context;
}
