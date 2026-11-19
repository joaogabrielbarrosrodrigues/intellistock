/**
 * Título: Navegação: acesso, abas e alerta de estoque
 * Explicação: Componente de navegação principal. Decide qual conjunto de telas mostrar conforme a
 *   sessão e define as abas.
 */
import Ionicons from "@expo/vector-icons/Ionicons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useEffect, useRef } from "react";
import { ActivityIndicator, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BrandLogo } from "../components/BrandLogo";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { ContasScreen } from "../screens/ContasScreen";
import { DashboardScreen } from "../screens/DashboardScreen";
import { EstoqueScreen } from "../screens/EstoqueScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { RegisterScreen } from "../screens/RegisterScreen";
import { MaisScreen } from "../screens/MaisScreen";
import { FornecedoresScreen } from "../screens/FornecedoresScreen";
import { AnalisesScreen } from "../screens/AnalisesScreen";
import { ProdutosScreen } from "../screens/ProdutosScreen";
import { useEstoqueQuery } from "../hooks/useIntellistockQueries";
import { DueReminderProvider } from "../notifications/DueReminderProvider";
import { formatQuantity } from "../utils";
import type { AppTabParamList, AuthStackParamList, MaisStackParamList } from "./types";

export type { AppTabParamList, AuthStackParamList } from "./types";

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<AppTabParamList>();
const MaisStack = createNativeStackNavigator<MaisStackParamList>();

/**
 * Título: Pilha da aba Mais: Menu, Fornecedores e Análises
 * Explicação: Usada só dentro deste arquivo.
 */
function MaisNavigator() {
  return (
    <MaisStack.Navigator screenOptions={{ headerShown: false }}>
      <MaisStack.Screen name="Menu" component={MaisScreen} />
      <MaisStack.Screen name="Fornecedores" component={FornecedoresScreen} />
      <MaisStack.Screen name="Analises" component={AnalisesScreen} />
    </MaisStack.Navigator>
  );
}

/**
 * Título: A barra de abas inferior com as cinco abas
 * Explicação: Usada só dentro deste arquivo, por AuthenticatedApp.
 */
function AppTabs() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 8);
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 58 + bottomPadding, paddingBottom: bottomPadding, paddingTop: 6 },
        tabBarLabelStyle: { fontFamily: typography.bodyStrong, fontSize: 11 },
        tabBarIcon: ({ color, size }) => {
          const iconName =
            route.name === "Dashboard"
              ? "grid-outline"
              : route.name === "Produtos"
                ? "cube-outline"
                : route.name === "Estoque"
                  ? "layers-outline"
                  : route.name === "Contas"
                    ? "card-outline"
                    : "ellipsis-horizontal-circle-outline";

          return <Ionicons name={iconName} size={size} color={color} />;
        }
      })}
    >
      {/*
        Título: Abas inferiores
        Explicação: Cada Tab.Screen liga uma aba à sua tela: Visão geral, Produtos, Estoque, Contas e Mais.
      */}
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Produtos" component={ProdutosScreen} />
      <Tab.Screen name="Estoque" component={EstoqueScreen} />
      <Tab.Screen name="Contas" component={ContasScreen} />
      <Tab.Screen name="Mais" component={MaisNavigator} />
    </Tab.Navigator>
  );
}

/**
 * Título: O app logado: vigia o estoque para o alerta e liga os lembretes de vencimento
 * Explicação: Usada só dentro deste arquivo, por RootNavigator.
 */
function AuthenticatedApp() {
  const estoqueQuery = useEstoqueQuery();
  const { showToast } = useToast();
  const previousLowStock = useRef<Record<string, boolean>>({});
  const initialized = useRef(false);

  useEffect(() => {
    if (!estoqueQuery.isSuccess || !estoqueQuery.data) return;

    const lowStock = estoqueQuery.data.filter((item) => item.situacao !== "NORMAL");
    const newlyLow = initialized.current
      ? lowStock.filter((item) => previousLowStock.current[item.produtoId] === false)
      : lowStock;

    previousLowStock.current = Object.fromEntries(
      estoqueQuery.data.map((item) => [item.produtoId, item.situacao !== "NORMAL"])
    );
    initialized.current = true;

    if (newlyLow.length === 0) return;

    const names = newlyLow.slice(0, 2).map((item) => `${item.produtoNome} (${formatQuantity(item.quantidade, item.unidadeMedida)})`);
    const extra = newlyLow.length > 2 ? ` e mais ${newlyLow.length - 2}` : "";
    showToast({
      title: "Alerta de estoque",
      message: `${names.join(", ")}${extra} atingiu o estoque mínimo.`,
      tone: "warning"
    });
  }, [estoqueQuery.data, estoqueQuery.isSuccess, showToast]);

  return <DueReminderProvider><AppTabs /></DueReminderProvider>;
}

/**
 * Título: Escolhe entre carregamento, acesso e app logado conforme a sessão
 * Explicação: Usado por App.
 */
export function RootNavigator() {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 28, backgroundColor: colors.surface }}>
        <BrandLogo width={180} />
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!token) {
    return (
      <AuthStack.Navigator screenOptions={{ headerShown: false }}>
        <AuthStack.Screen name="Login" component={LoginScreen} />
        <AuthStack.Screen name="Register" component={RegisterScreen} />
      </AuthStack.Navigator>
    );
  }

  return <AuthenticatedApp />;
}
