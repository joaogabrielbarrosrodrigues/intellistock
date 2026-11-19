/**
 * Título: Moldura padrão das telas
 * Explicação: Componente de moldura usado por todas as telas.
 */
import type { ReactNode } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import { spacing } from "../theme/tokens";

export type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
};

/**
 * Título: Moldura padrão das telas (componente Screen)
 * Explicação: Respeita a área segura do celular (entalhe e barras). Opcionalmente rola e permite puxar
 *   para atualizar. Limita a largura a 760 px e aplica o espaçamento padrão. Usado por AnalisesScreen,
 *   ContasScreen, DashboardScreen, EstoqueScreen, FornecedoresScreen e MaisScreen e outros.
 */
export function Screen({ children, scroll = true, refreshing = false, onRefresh }: ScreenProps) {
  const content = <View style={styles.content}>{children}</View>;

  return (
    <SafeAreaView style={styles.safeArea}>
      {scroll ? (
        // Título: Rolagem com puxar para atualizar
        // Explicação: Se a tela passar onRefresh, o RefreshControl chama essa função quando o usuário puxa a
        //   tela para baixo.
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} /> : undefined}
        >
          {content}
        </ScrollView>
      ) : content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  scroll: {
    flexGrow: 1
  },
  content: {
    alignSelf: "center",
    flex: 1,
    maxWidth: 760,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
    width: "100%"
  }
});
