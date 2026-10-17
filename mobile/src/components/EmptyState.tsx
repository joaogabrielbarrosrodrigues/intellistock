import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { radius, spacing } from "../theme/tokens";

export type EmptyStateProps = { message: string; title?: string };

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
