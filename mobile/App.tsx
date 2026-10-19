import { NavigationContainer } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/contexts/AuthContext";
import { ToastProvider } from "./src/contexts/ToastContext";
import { AppErrorBoundary } from "./src/components/AppErrorBoundary";
import { RootNavigator } from "./src/navigation/RootNavigator";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

export default function App() {
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <AuthProvider>
            <ToastProvider>
              <NavigationContainer>
                <StatusBar style="dark" />
                <RootNavigator />
              </NavigationContainer>
            </ToastProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}
