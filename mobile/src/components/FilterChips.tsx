import { Pressable, StyleSheet, View } from "react-native";
import { colors } from "../theme/colors";
import { radius, spacing } from "../theme/tokens";
import { AppText as Text } from "./AppText";

type Props<T extends string> = {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

// Filtro de seleção única exibido acima das listas.
export function FilterChips<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <View style={styles.container}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected }}
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <Text style={[styles.text, selected && styles.textSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  chip: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: spacing.sm, paddingVertical: 8 },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  text: { color: colors.textSecondary, fontSize: 13, fontWeight: "800" },
  textSelected: { color: colors.white }
});
