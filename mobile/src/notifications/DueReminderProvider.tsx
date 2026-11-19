/**
 * Título: Liga os lembretes de vencimento
 * Explicação: Componente provedor que cuida dos lembretes de vencimento das contas enquanto o usuário
 *   está logado.
 */
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { AppState, Platform } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { useContasQuery } from "../hooks/useIntellistockQueries";
import { checkDueReminderPermission, reconcileDueReminders } from "./dueReminderScheduler";

type ReminderStatus = "checking" | "enabled" | "disabled" | "error" | "unsupported";
const DueReminderContext = createContext<ReminderStatus>("checking");

/**
 * Título: Componente que cuida da permissão e da sincronização dos lembretes
 * Explicação: Usado por RootNavigator.
 */
export function DueReminderProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const accounts = useContasQuery();
  const [status, setStatus] = useState<ReminderStatus>("checking");

  useEffect(() => {
    if (Platform.OS === "web") {
      setStatus("unsupported");
      return;
    }
    let active = true;
    checkDueReminderPermission(true)
      .then((enabled) => { if (active) setStatus(enabled ? "enabled" : "disabled"); })
      .catch(() => { if (active) setStatus("error"); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (status !== "enabled" || !accounts.isSuccess || !accounts.data || !user) return;
    void reconcileDueReminders(accounts.data, user.id).catch(() => setStatus("error"));
  }, [accounts.data, accounts.isSuccess, status, user]);

  useEffect(() => {
    if (Platform.OS === "web") return;
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      void checkDueReminderPermission(false)
        .then((enabled) => setStatus(enabled ? "enabled" : "disabled"))
        .catch(() => setStatus("error"));
      void accounts.refetch();
    });
    return () => subscription.remove();
  }, [accounts.refetch]);

  return <DueReminderContext.Provider value={status}>{children}</DueReminderContext.Provider>;
}

/**
 * Título: Informa à tela de Contas se os lembretes estão ativos
 * Explicação: Usado por ContasScreen.
 */
export function useDueReminderStatus() {
  return useContext(DueReminderContext);
}
