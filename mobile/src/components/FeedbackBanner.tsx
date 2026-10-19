import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { radius, spacing } from "../theme/tokens";

export type FeedbackTone = "success" | "error";

export function FeedbackBanner({ message, tone = "success" }: { message?: string | null; tone?: FeedbackTone }) {
  if (!message) return null;

  const isError = tone === "error";
  return (
    <View accessibilityRole="alert" style={[styles.container, isError ? styles.error : styles.success]}>
      <Ionicons
        color={isError ? colors.danger : colors.success}
        name={isError ? "alert-circle-outline" : "checkmark-circle-outline"}
        size={20}
      />
      <Text style={[styles.message, isError ? styles.errorText : styles.successText]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    borderRadius: radius.sm,
    flexDirection: "row",
    gap: spacing.xs,
    padding: spacing.sm
  },
  success: { backgroundColor: colors.successLight },
  error: { backgroundColor: colors.dangerLight },
  message: { flex: 1, fontWeight: "700", lineHeight: 19 },
  successText: { color: colors.success },
  errorText: { color: colors.danger }
});
