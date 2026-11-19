/**
 * Título: Aviso de lista vazia
 * Explicação: Componente de lista vazia.
 */
import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, View } from "react-native";
import { colors } from "../theme/colors";
import { radius, spacing } from "../theme/tokens";
import { AppText as Text } from "./AppText";

export type EmptyStateProps = { message: string; title?: string };

/**
 * Título: Aviso de lista vazia (componente EmptyState)
 * Explicação: Mostra um ícone, um título (padrão "Nada por aqui") e uma mensagem explicando o que
 *   fazer. Usado por AnalisesScreen, ContasScreen, EstoqueScreen, FornecedoresScreen e ProdutosScreen.
 */
export function EmptyState({ message, title = "Nada por aqui" }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Ionicons name="file-tray-outline" size={32} color={colors.primary} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.lg, gap: spacing.xs, padding: spacing.xl },
  title: { color: colors.text, fontSize: 16, fontWeight: "800" },
  text: { color: colors.muted, textAlign: "center" }
});
