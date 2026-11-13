import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import { radius, shadow, spacing } from "../theme/tokens";
import { AppText as Text } from "./AppText";
import { BrandLogo } from "./BrandLogo";

// Estrutura comum das telas de login e de cadastro: marca no topo e formulário em um cartão.
export function AuthLayout({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: undefined })}
        style={styles.container}
      >
        <View style={styles.topGlow} />
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <View style={styles.brand}>
              <BrandLogo />
              <Text style={styles.subtitle}>Estoque e compras sob controle.</Text>
            </View>
            <View style={styles.form}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.description}>{description}</Text>
              {children}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function AuthNotice({ message, tone }: { message?: string | null; tone: "error" | "success" }) {
  if (!message) return null;
  return (
    <Text accessibilityRole="alert" style={[styles.notice, tone === "error" ? styles.error : styles.success]}>
      {message}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.background, flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "center" },
  topGlow: { backgroundColor: colors.primaryLight, borderBottomLeftRadius: 140, borderBottomRightRadius: 140, height: 260, left: 0, opacity: 0.85, position: "absolute", right: 0, top: 0 },
  content: { alignSelf: "center", gap: spacing.xl, maxWidth: 520, padding: spacing.lg, width: "100%" },
  brand: { alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.lg, gap: spacing.sm, paddingVertical: spacing.lg },
  subtitle: { color: colors.textSecondary, fontSize: 14, paddingHorizontal: spacing.sm, textAlign: "center" },
  form: { backgroundColor: colors.surface, borderRadius: radius.lg, gap: spacing.md, padding: spacing.lg, ...shadow.card },
  title: { color: colors.text, fontSize: 22, fontWeight: "800" },
  description: { color: colors.muted, marginTop: -spacing.xs },
  notice: { borderRadius: radius.sm, padding: spacing.sm, textAlign: "center" },
  error: { backgroundColor: colors.dangerLight, color: colors.danger },
  success: { backgroundColor: colors.successLight, color: colors.success }
});
