/**
 * Título: Cabeçalho das abas com botão Sair
 * Explicação: Componente de cabeçalho das abas.
 */
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

/**
 * Título: Cabeçalho das abas com botão Sair (componente Header)
 * Explicação: Mostra o símbolo do logotipo, o título e o subtítulo da tela. Botão de sair, que abre
 *   uma confirmação e então chama signOut do AuthContext. Usado por ContasScreen, DashboardScreen,
 *   EstoqueScreen, MaisScreen e ProdutosScreen.
 */
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
      {/*
        Título: Botão Sair
        Explicação: Chama setConfirmingExit(true), que só abre a janela de confirmação.
      */}
      <Pressable accessibilityHint="Abre a confirmação para sair" accessibilityLabel="Sair" accessibilityRole="button" style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} onPress={() => setConfirmingExit(true)}>
        <Ionicons name="log-out-outline" size={22} color={colors.primaryDark} />
      </Pressable>
      {/*
        Título: Confirmação de sair
        Explicação: Confirmar chama signOut() do AuthContext, que tira o token do axios, apaga a sessão
          salva e cancela os lembretes. O RootNavigator volta para o Login. Não chama o backend.
      */}
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
