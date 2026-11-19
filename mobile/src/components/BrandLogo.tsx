/**
 * Título: Logotipo do InteliStock
 * Explicação: Componente do logotipo do InteliStock.
 */
import { Image, StyleSheet, View } from "react-native";

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

/**
 * Título: Logotipo do InteliStock (componente BrandLogo)
 * Explicação: Recorta a imagem original para mostrar o logotipo completo ou só o símbolo, no tamanho
 *   pedido, sem distorcer. Usado por App, BackHeader, Header, RootNavigator, LoginScreen e
 *   RegisterScreen.
 */
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
  frame: { backgroundColor: "#FFFFFF", flexShrink: 0, overflow: "hidden" }
});
