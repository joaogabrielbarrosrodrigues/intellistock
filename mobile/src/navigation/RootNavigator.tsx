import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";
import { colors } from "../theme/colors";
import { useAuth } from "../contexts/AuthContext";
import { ContasScreen } from "../screens/ContasScreen";
import { DashboardScreen } from "../screens/DashboardScreen";
import { EstoqueScreen } from "../screens/EstoqueScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { ProdutosScreen } from "../screens/ProdutosScreen";

export type AuthStackParamList = {
  Login: undefined;
};

export type AppTabParamList = {
  Dashboard: undefined;
  Produtos: undefined;
  Estoque: undefined;
  Contas: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<AppTabParamList>();

function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { borderTopColor: colors.border, height: 62, paddingBottom: 8, paddingTop: 6 },
        tabBarIcon: ({ color, size }) => {
          const iconName =
            route.name === "Dashboard"
              ? "grid-outline"
              : route.name === "Produtos"
                ? "cube-outline"
                : route.name === "Estoque"
                  ? "layers-outline"
                  : "card-outline";

          return <Ionicons name={iconName} size={size} color={color} />;
        }
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Produtos" component={ProdutosScreen} />
      <Tab.Screen name="Estoque" component={EstoqueScreen} />
      <Tab.Screen name="Contas" component={ContasScreen} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!token) {
    return (
      <AuthStack.Navigator screenOptions={{ headerShown: false }}>
        <AuthStack.Screen name="Login" component={LoginScreen} />
      </AuthStack.Navigator>
    );
  }

  return <AppTabs />;
}
