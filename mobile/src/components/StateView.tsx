import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

export type StateViewProps = {
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
};

export function StateView({ loading = false, error = null, onRetry }: StateViewProps) {
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.text}>Carregando dados...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{error}</Text>
        {onRetry ? (
          <Pressable accessibilityRole="button" style={styles.button} onPress={onRetry}>
            <Text style={styles.buttonText}>Tentar novamente</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 20
  },
  text: {
    color: colors.muted
  },
  error: {
    color: colors.danger,
    textAlign: "center"
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700"
  }
});
