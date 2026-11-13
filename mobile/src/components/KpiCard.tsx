import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, View } from "react-native";
import { colors } from "../theme/colors";
import { radius, shadow, spacing } from "../theme/tokens";
import { AppText as Text } from "./AppText";

export type KpiCardProps = {
  label: string;
  value: string;
  tone?: "primary" | "warning" | "danger";
  icon?: "cube-outline" | "alert-circle-outline" | "wallet-outline" | "card-outline" | "calendar-outline";
  detail?: string;
};

export function KpiCard({ label, value, tone = "primary", icon, detail }: KpiCardProps) {
  const valueColor = tone === "danger" ? colors.danger : tone === "warning" ? colors.warning : colors.primary;

  return (
    <View style={styles.card}>
      <View style={styles.topLine}>{icon ? <Ionicons color={valueColor} name={icon} size={20} /> : null}<Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={[styles.value, { color: valueColor }]}>{value}</Text></View>
      <Text style={styles.label}>{label}</Text>
      {detail ? <Text style={styles.detail}>{detail}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    flex: 1,
    minHeight: 92,
    padding: spacing.md,
    justifyContent: "space-between",
    ...shadow.card
  },
  topLine: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs
  },
  value: {
    flexShrink: 1,
    fontSize: 22,
    fontWeight: "800"
  },
  label: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18
  },
  detail: { color: colors.textSecondary, fontSize: 12, lineHeight: 17 }
});
