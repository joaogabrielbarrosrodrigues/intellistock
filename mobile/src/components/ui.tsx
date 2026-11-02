import type { ReactNode } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, TextInput, type TextInputProps, View } from "react-native";
import { colors } from "../theme/colors";
import { radius, shadow, spacing } from "../theme/tokens";
import { typography } from "../theme/typography";
import { AppText as Text } from "./AppText";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

export function Button({ title, onPress, variant = "primary", loading = false, disabled = false, compact = false }: {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  compact?: boolean;
}) {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [styles.button, styles[`button_${variant}`], compact && styles.buttonCompact, inactive && styles.buttonDisabled, pressed && !inactive && styles.buttonPressed]}
    >
      {loading ? <ActivityIndicator color={variant === "secondary" || variant === "ghost" ? colors.primary : colors.white} /> : <Text style={[styles.buttonText, styles[`buttonText_${variant}`]]}>{title}</Text>}
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function TextField({ label, error, multiline, style, ...props }: TextInputProps & { label: string; error?: string; style?: object }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        multiline={multiline}
        placeholderTextColor={colors.muted}
        style={[styles.input, multiline && styles.inputMultiline, error && styles.inputError, style]}
        {...props}
      />
      {error ? <Text accessibilityRole="alert" style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export function StatusBadge({ label, tone = "neutral" }: { label: string; tone?: "success" | "warning" | "danger" | "neutral" | "primary" }) {
  return <View style={[styles.badge, styles[`badge_${tone}`]]}><Text style={[styles.badgeText, styles[`badgeText_${tone}`]]}>{label}</Text></View>;
}

export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return <View style={styles.sectionTitle}><Text style={styles.sectionTitleText}>{title}</Text>{action}</View>;
}

export function FormModal({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: ReactNode }) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Pressable accessibilityLabel="Fechar" accessibilityRole="button" onPress={onClose} style={styles.closeButton}><Text style={styles.closeText}>×</Text></Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">{children}</ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function ConfirmationDialog({ visible, title, message, confirmLabel = "Confirmar", confirmVariant = "danger", onCancel, onConfirm, loading = false }: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: ButtonVariant;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
}) {
  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible={visible}>
      <View style={styles.dialogBackdrop}>
        <View style={styles.dialog}>
          <Text style={styles.dialogTitle}>{title}</Text>
          <Text style={styles.dialogMessage}>{message}</Text>
          <View style={styles.dialogActions}>
            <View style={styles.dialogAction}><Button compact title="Cancelar" variant="secondary" onPress={onCancel} /></View>
            <View style={styles.dialogAction}><Button compact title={confirmLabel} variant={confirmVariant} loading={loading} onPress={onConfirm} /></View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: "center", borderRadius: radius.md, justifyContent: "center", minHeight: 48, paddingHorizontal: spacing.md },
  buttonCompact: { minHeight: 38, paddingHorizontal: spacing.sm },
  button_primary: { backgroundColor: colors.primary },
  button_secondary: { backgroundColor: colors.surfaceMuted, borderColor: colors.primary, borderWidth: 1 },
  button_danger: { backgroundColor: colors.danger },
  button_ghost: { backgroundColor: "transparent" },
  buttonDisabled: { opacity: 0.58 },
  buttonPressed: { opacity: 0.82 },
  buttonText: { fontSize: 15, fontWeight: "800" },
  buttonText_primary: { color: colors.white },
  buttonText_secondary: { color: colors.primaryDark },
  buttonText_danger: { color: colors.white },
  buttonText_ghost: { color: colors.primary },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, ...shadow.card },
  field: { gap: spacing.xs },
  fieldLabel: { color: colors.textSecondary, fontSize: 14, fontWeight: "700" },
  input: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.sm, borderWidth: 1, color: colors.text, fontFamily: typography.body, fontSize: 16, minHeight: 48, paddingHorizontal: spacing.sm },
  inputMultiline: { minHeight: 96, paddingTop: spacing.sm, textAlignVertical: "top" },
  inputError: { borderColor: colors.danger },
  fieldError: { color: colors.danger, fontSize: 12 },
  badge: { alignSelf: "flex-start", borderRadius: radius.pill, paddingHorizontal: spacing.xs, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.2 },
  badge_success: { backgroundColor: colors.successLight }, badgeText_success: { color: colors.success },
  badge_warning: { backgroundColor: colors.warningLight }, badgeText_warning: { color: colors.warning },
  badge_danger: { backgroundColor: colors.dangerLight }, badgeText_danger: { color: colors.danger },
  badge_neutral: { backgroundColor: colors.surfaceMuted }, badgeText_neutral: { color: colors.textSecondary },
  badge_primary: { backgroundColor: colors.primaryLight }, badgeText_primary: { color: colors.primaryDark },
  sectionTitle: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: spacing.xs },
  sectionTitleText: { color: colors.text, fontSize: 18, fontWeight: "800" },
  modalBackdrop: { backgroundColor: colors.overlay, flex: 1, justifyContent: "flex-end" },
  modal: { backgroundColor: colors.background, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, maxHeight: "91%" },
  modalHeader: { alignItems: "center", backgroundColor: colors.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  modalTitle: { color: colors.text, flex: 1, fontSize: 20, fontWeight: "800" },
  closeButton: { alignItems: "center", backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, height: 34, justifyContent: "center", width: 34 },
  closeText: { color: colors.textSecondary, fontSize: 26, fontWeight: "400", lineHeight: 30 },
  modalContent: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xxl },
  dialogBackdrop: { alignItems: "center", backgroundColor: colors.overlay, flex: 1, justifyContent: "center", padding: spacing.lg },
  dialog: { backgroundColor: colors.surface, borderRadius: radius.lg, gap: spacing.sm, padding: spacing.lg, width: "100%", ...shadow.card },
  dialogTitle: { color: colors.text, fontSize: 19, fontWeight: "800" },
  dialogMessage: { color: colors.textSecondary, lineHeight: 21 },
  dialogActions: { flexDirection: "row", gap: spacing.sm, justifyContent: "flex-end", marginTop: spacing.sm },
  dialogAction: { minWidth: 110 }
});
