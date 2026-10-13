import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

export type KpiCardProps = {
  label: string;
  value: string;
  tone?: "primary" | "warning" | "danger";
};

export function KpiCard({ label, value, tone = "primary" }: KpiCardProps) {
  const valueColor = tone === "danger" ? colors.danger : tone === "warning" ? colors.warning : colors.primary;

  return (
    <View style={styles.card}>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 92,
    padding: 14,
    justifyContent: "space-between"
  },
  value: {
    fontSize: 24,
    fontWeight: "800"
  },
  label: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18
  }
});
