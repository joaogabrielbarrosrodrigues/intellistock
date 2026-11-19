/**
 * Título: Carregando e erro com Tentar novamente
 * Explicação: Componente que mostra o estado de uma busca.
 */
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { colors } from "../theme/colors";
import { radius, spacing } from "../theme/tokens";
import { AppText as Text } from "./AppText";

export type StateViewProps = {
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
};

/**
 * Título: Carregando e erro com Tentar novamente (componente StateView)
 * Explicação: Com loading, mostra o indicador e "Carregando dados...". Com error, mostra a mensagem e,
 *   se receber onRetry, o botão "Tentar novamente". Sem nenhum dos dois, não mostra nada. Usado por
 *   ContaFormModal, ProductFormModal, AnalisesScreen, ContasScreen, DashboardScreen e EstoqueScreen e
 *   outros.
 */
export function StateView({ loading = false, error = null, onRetry }: StateViewProps) {
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.text}>Carregando dados...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{error}</Text>
        {onRetry ? (
          // Título: Botão Tentar novamente
          // Explicação: Chama o onRetry recebido; nas telas é o refetch() da consulta que falhou.
          <Pressable accessibilityRole="button" style={styles.button} onPress={onRetry}>
            <Text style={styles.buttonText}>Tentar novamente</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    gap: spacing.sm,
    padding: spacing.lg
  },
  text: {
    color: colors.muted
  },
  error: {
    color: colors.danger,
    textAlign: "center"
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700"
  }
});
