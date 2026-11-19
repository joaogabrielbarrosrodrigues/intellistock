/**
 * Título: Tela do menu Mais
 * Explicação: Tela de menu da aba Mais.
 */
import Ionicons from "@expo/vector-icons/Ionicons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText as Text } from "../components/AppText";
import { Header } from "../components/Header";
import { Screen } from "../components/Screen";
import { Card } from "../components/ui";
import type { MaisStackParamList } from "../navigation/types";
import { colors } from "../theme/colors";
import { radius, shadow, spacing } from "../theme/tokens";

/**
 * Título: Tela do menu Mais (componente MaisScreen)
 * Explicação: Dois cartões tocáveis (MenuCard): Fornecedores e Análise e reposição, que abrem as telas
 *   correspondentes na pilha da aba. Um cartão de orientação sobre as sugestões de compra. Usado por
 *   RootNavigator.
 */
export function MaisScreen({ navigation }: NativeStackScreenProps<MaisStackParamList, "Menu">) {
  return (
    <Screen>
      <Header subtitle="Fornecedores e planejamento" title="Mais" />
      {/*
        Título: Cartão Fornecedores
        Explicação: Chama navigation.navigate("Fornecedores") e abre a FornecedoresScreen.
      */}
      <MenuCard
        icon="people-outline"
        onPress={() => navigation.navigate("Fornecedores")}
        subtitle="Cadastre e mantenha parceiros atualizados"
        title="Fornecedores"
      />
      {/*
        Título: Cartão Análise e reposição
        Explicação: Chama navigation.navigate("Analises") e abre a AnalisesScreen.
      */}
      <MenuCard
        icon="analytics-outline"
        onPress={() => navigation.navigate("Analises")}
        subtitle="Acompanhe o consumo e planeje compras"
        title="Análise e reposição"
      />
      <Card style={styles.note}>
        <Text style={styles.noteTitle}>Como usar as sugestões</Text>
        <Text style={styles.noteText}>
          Confira o consumo registrado, o estoque atual e o prazo de entrega antes de comprar.
        </Text>
      </Card>
    </Screen>
  );
}

/**
 * Título: Cartão tocável do menu
 * Explicação: Usada só dentro deste arquivo, por MaisScreen.
 */
function MenuCard({
  icon,
  title,
  subtitle,
  onPress
}: {
  icon: "people-outline" | "analytics-outline";
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    // Título: Toque do cartão do menu
    // Explicação: Chama o onPress recebido, que é a navegação definida na MaisScreen.
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.menuCard}>
      <View style={styles.menuIcon}>
        <Ionicons color={colors.primary} name={icon} size={24} />
      </View>
      <View style={styles.menuText}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons color={colors.muted} name="chevron-forward" size={20} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  menuCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
    ...shadow.card
  },
  menuIcon: {
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  menuText: { flex: 1 },
  menuTitle: { color: colors.text, fontSize: 16, fontWeight: "800" },
  menuSubtitle: { color: colors.muted, fontSize: 13, lineHeight: 18, marginTop: 3 },
  note: { backgroundColor: colors.primaryLight },
  noteTitle: { color: colors.primaryDark, fontSize: 16, fontWeight: "800" },
  noteText: { color: colors.textSecondary, lineHeight: 20, marginTop: 5 },
});
