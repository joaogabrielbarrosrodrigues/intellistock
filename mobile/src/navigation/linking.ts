import type { LinkingOptions } from "@react-navigation/native";
import { Platform } from "react-native";
import type { RootLinkParamList } from "./types";

export const linking: LinkingOptions<RootLinkParamList> = {
  enabled: Platform.OS === "web",
  prefixes: [],
  config: {
    screens: {
      Login: "entrar",
      Register: "cadastro",
      Dashboard: "",
      Produtos: "produtos",
      Estoque: "estoque",
      Contas: "contas",
      Mais: {
        path: "mais",
        initialRouteName: "Menu",
        screens: {
          Menu: "",
          Fornecedores: "fornecedores",
          Analises: "analises"
        }
      }
    }
  }
};
