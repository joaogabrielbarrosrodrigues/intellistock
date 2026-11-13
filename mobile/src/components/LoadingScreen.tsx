import { ActivityIndicator, StyleSheet, View } from "react-native";
import { colors } from "../theme/colors";
import { BrandLogo } from "./BrandLogo";

// Tela exibida enquanto as fontes ou a sessão salva ainda estão carregando.
export function LoadingScreen() {
  return (
    <View style={styles.container}>
      <BrandLogo width={180} />
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", backgroundColor: colors.surface, flex: 1, gap: 28, justifyContent: "center" }
});
