import { Image, StyleSheet, View } from "react-native";
import { colors } from "../theme/colors";

const logoSource = require("../../assets/brand/intelistock-logo.png");
const sourceSize = 1254;

// Enquadra a imagem original sem alterar as cores, o desenho ou as proporções.
const regions = {
  full: { x: 88, y: 174, width: 1078, height: 870 },
  symbol: { x: 370, y: 170, width: 515, height: 670 }
} as const;

type Props = {
  variant?: keyof typeof regions;
  width?: number;
};

export function BrandLogo({ variant = "full", width = 240 }: Props) {
  const region = regions[variant];
  const scale = width / region.width;

  return (
    <View
      accessibilityLabel="InteliStock"
      accessibilityRole="image"
      accessible
      style={[styles.frame, { width, height: region.height * scale }]}
    >
      <Image
        accessible={false}
        resizeMode="contain"
        source={logoSource}
        style={{
          position: "absolute",
          width: sourceSize * scale,
          height: sourceSize * scale,
          left: -region.x * scale,
          top: -region.y * scale
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { backgroundColor: colors.white, flexShrink: 0, overflow: "hidden" }
});
