/**
 * Título: Texto com as fontes do app
 * Explicação: Componente de texto do app, usado no lugar do Text do React Native.
 */
import { createContext, useContext, type ReactNode } from "react";
import { StyleSheet, Text as NativeText, type TextProps } from "react-native";
import { fontForWeight } from "../theme/typography";

const CustomFontsContext = createContext(false);

/**
 * Título: Informa se as fontes carregaram
 * Explicação: Usado por App.
 */
export function CustomFontsProvider({ loaded, children }: { loaded: boolean; children: ReactNode }) {
  return <CustomFontsContext.Provider value={loaded}>{children}</CustomFontsContext.Provider>;
}

/**
 * Título: Texto com a fonte certa
 * Explicação: Usado por AppErrorBoundary, BackHeader, ContaFormModal, EmptyState, FeedbackBanner e
 *   FornecedorFormModal e outros.
 */
export function AppText({ style, ...props }: TextProps) {
  const customFontsLoaded = useContext(CustomFontsContext);
  if (!customFontsLoaded) return <NativeText style={style} {...props} />;

  const flattened = StyleSheet.flatten(style);
  const fontFamily = flattened?.fontFamily ?? fontForWeight(flattened?.fontWeight);

  return <NativeText style={[style, { fontFamily, fontWeight: "normal" }]} {...props} />;
}
