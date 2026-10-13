import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { colors } from "../theme/colors";

export type HeaderProps = { title: string; subtitle?: string };

export function Header({ title, subtitle }: HeaderProps) {
  const { signOut } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Pressable accessibilityLabel="Sair" accessibilityRole="button" style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} onPress={() => void signOut()}>
        <Ionicons name="log-out-outline" size={22} color={colors.primaryDark} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12
  },
  textBlock: {
    flex: 1
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "800"
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 2
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    height: 42,
    justifyContent: "center",
    width: 42
  },
  buttonPressed: {
    opacity: 0.7
  }
});
