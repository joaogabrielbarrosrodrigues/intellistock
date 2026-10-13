import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

export type EmptyStateProps = { message: string };

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Ionicons name="file-tray-outline" size={30} color={colors.muted} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 8, borderWidth: 1, gap: 8, padding: 28 },
  text: { color: colors.muted, textAlign: "center" }
});
