import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { colors } from "../theme/colors";
import { radius, spacing } from "../theme/tokens";
import { AppText as Text } from "./AppText";
import { BrandLogo } from "./BrandLogo";
import { ConfirmationDialog } from "./ui";

export type HeaderProps = { title: string; subtitle?: string };

export function Header({ title, subtitle }: HeaderProps) {
  const { signOut } = useAuth();
  const [confirmingExit, setConfirmingExit] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.brandMark}><BrandLogo variant="symbol" width={36} /></View>
      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Pressable accessibilityHint="Abre a confirmação para sair" accessibilityLabel="Sair" accessibilityRole="button" style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} onPress={() => setConfirmingExit(true)}>
        <Ionicons name="log-out-outline" size={22} color={colors.primaryDark} />
      </Pressable>
      <ConfirmationDialog
        visible={confirmingExit}
        title="Sair da conta?"
        message="Deseja encerrar a sessão neste dispositivo?"
        confirmLabel="Sair"
        confirmVariant="primary"
        onCancel={() => setConfirmingExit(false)}
        onConfirm={() => { setConfirmingExit(false); void signOut(); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12
  },
  textBlock: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0
  },
  brandMark: { flexShrink: 0 },
  title: {
    color: colors.text,
    flexShrink: 1,
    fontSize: 28,
    fontWeight: "800"
  },
  subtitle: {
    color: colors.muted,
    flexShrink: 1,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xxs
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    flexShrink: 0,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  buttonPressed: {
    opacity: 0.7
  }
});
