import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_500Medium } from "@expo-google-fonts/inter/500Medium";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { Inter_700Bold } from "@expo-google-fonts/inter/700Bold";
import { Montserrat_600SemiBold } from "@expo-google-fonts/montserrat/600SemiBold";
import { Montserrat_700Bold } from "@expo-google-fonts/montserrat/700Bold";
import { NavigationContainer } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/contexts/AuthContext";
import { ToastProvider } from "./src/contexts/ToastContext";
import { AppErrorBoundary } from "./src/components/AppErrorBoundary";
import { BrandLogo } from "./src/components/BrandLogo";
import { CustomFontsProvider } from "./src/components/AppText";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { linking } from "./src/navigation/linking";
import { colors } from "./src/theme/colors";
import { typography } from "./src/theme/typography";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    [typography.body]: Inter_400Regular,
    [typography.bodyMedium]: Inter_500Medium,
    [typography.bodyStrong]: Inter_600SemiBold,
    [typography.bodyBold]: Inter_700Bold,
    [typography.heading]: Montserrat_600SemiBold,
    [typography.display]: Montserrat_700Bold
  });

  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.loading}>
        <StatusBar style="dark" />
        <BrandLogo width={180} />
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <CustomFontsProvider loaded={fontsLoaded}>
      <AppErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider>
            <AuthProvider>
              <ToastProvider>
                <NavigationContainer linking={linking}>
                  <StatusBar style="dark" />
                  <RootNavigator />
                </NavigationContainer>
              </ToastProvider>
            </AuthProvider>
          </SafeAreaProvider>
        </QueryClientProvider>
      </AppErrorBoundary>
    </CustomFontsProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: "center",
    backgroundColor: colors.surface,
    flex: 1,
    gap: 28,
    justifyContent: "center"
  }
});
