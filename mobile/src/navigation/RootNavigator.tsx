import Ionicons from "@expo/vector-icons/Ionicons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useEffect, useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LoadingScreen } from "../components/LoadingScreen";
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
import { ProdutosScreen } from "../screens/ProdutosScreen";
import { useEstoqueQuery } from "../hooks/useIntellistockQueries";
import { DueReminderProvider } from "../notifications/DueReminderProvider";
import { formatQuantity } from "../utils";

export type AuthStackParamList = {
  Login: { email?: string; cadastroConcluido?: boolean } | undefined;
  Register: undefined;
};

export type AppTabParamList = {
  Dashboard: undefined;
  Produtos: undefined;
  Estoque: undefined;
  Contas: undefined;
  Mais: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<AppTabParamList>();

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
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Produtos" component={ProdutosScreen} />
      <Tab.Screen name="Estoque" component={EstoqueScreen} />
      <Tab.Screen name="Contas" component={ContasScreen} />
      <Tab.Screen name="Mais" component={MaisScreen} />
    </Tab.Navigator>
  );
}

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
      message: `${names.join(", ")}${extra} atingiu o estoque mínimo.`
    });
  }, [estoqueQuery.data, estoqueQuery.isSuccess, showToast]);

  return <DueReminderProvider><AppTabs /></DueReminderProvider>;
}

export function RootNavigator() {
  const { token, loading } = useAuth();

  if (loading) return <LoadingScreen />;

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
