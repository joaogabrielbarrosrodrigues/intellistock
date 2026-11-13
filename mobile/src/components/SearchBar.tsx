import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { colors } from "../theme/colors";
import { radius, spacing } from "../theme/tokens";
import { typography } from "../theme/typography";

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  searchLabel: string;
  addLabel: string;
  onAdd: () => void;
};

// Campo de busca das listas, acompanhado do botão de novo cadastro.
export function SearchBar({ value, onChangeText, placeholder, searchLabel, addLabel, onAdd }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.search}>
        <Ionicons color={colors.muted} name="search-outline" size={20} />
        <TextInput
          accessibilityLabel={searchLabel}
          autoCapitalize="none"
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={value}
        />
      </View>
      <Pressable accessibilityLabel={addLabel} accessibilityRole="button" onPress={onAdd} style={styles.add}>
        <Ionicons color={colors.white} name="add" size={24} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", gap: spacing.sm },
  search: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, flex: 1, flexDirection: "row", gap: spacing.xs, minHeight: 48, paddingHorizontal: spacing.sm },
  input: { color: colors.text, flex: 1, fontFamily: typography.body, fontSize: 16 },
  add: { alignItems: "center", backgroundColor: colors.primary, borderRadius: radius.md, justifyContent: "center", width: 48 }
});
