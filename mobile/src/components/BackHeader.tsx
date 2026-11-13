import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, View } from "react-native";
import { colors } from "../theme/colors";
import { radius, spacing } from "../theme/tokens";
import { AppText as Text } from "./AppText";
import { BrandLogo } from "./BrandLogo";

export function BackHeader({
  title,
  subtitle,
  onBack
}: {
  title: string;
  subtitle: string;
  onBack: () => void;
}) {
  return (
    <View style={styles.backHeader}>
      <Pressable
        accessibilityLabel="Voltar"
        accessibilityRole="button"
        onPress={onBack}
        style={styles.back}
      >
        <Ionicons color={colors.primaryDark} name="arrow-back" size={21} />
      </Pressable>
      <View style={styles.backText}>
        <Text style={styles.backTitle}>{title}</Text>
        <Text style={styles.backSubtitle}>{subtitle}</Text>
      </View>
      <View style={styles.brandMark}><BrandLogo variant="symbol" width={36} /></View>
    </View>
  );
}

const styles = StyleSheet.create({
  backHeader: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
  back: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    flexShrink: 0,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  backText: { flex: 1, flexShrink: 1, minWidth: 0 },
  brandMark: { flexShrink: 0 },
  backTitle: { color: colors.text, flexShrink: 1, fontSize: 25, fontWeight: "800" },
  backSubtitle: { color: colors.muted, flexShrink: 1, fontSize: 13, marginTop: 2 },
});
