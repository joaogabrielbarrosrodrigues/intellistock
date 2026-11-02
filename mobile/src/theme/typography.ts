import type { TextStyle } from "react-native";

export const typography = {
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodyStrong: "Inter_600SemiBold",
  bodyBold: "Inter_700Bold",
  heading: "Montserrat_600SemiBold",
  display: "Montserrat_700Bold"
} as const;

export function fontForWeight(weight?: TextStyle["fontWeight"]) {
  if (weight === "bold") return typography.bodyBold;

  const numericWeight = typeof weight === "string" ? Number(weight) : weight;
  if (typeof numericWeight !== "number" || Number.isNaN(numericWeight)) return typography.body;
  if (numericWeight >= 800) return typography.display;
  if (numericWeight >= 700) return typography.bodyBold;
  if (numericWeight >= 600) return typography.bodyStrong;
  if (numericWeight >= 500) return typography.bodyMedium;
  return typography.body;
}
