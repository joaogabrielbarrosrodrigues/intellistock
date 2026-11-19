/**
 * Título: Nomes e parâmetros das telas
 * Explicação: Definições de tipos das rotas de navegação.
 */
import type { NavigatorScreenParams } from "@react-navigation/native";

export type AuthStackParamList = {
  Login: { email?: string; cadastroConcluido?: boolean } | undefined;
  Register: undefined;
};

export type AppTabParamList = {
  Dashboard: undefined;
  Produtos: undefined;
  Estoque: undefined;
  Contas: undefined;
  Mais: NavigatorScreenParams<MaisStackParamList> | undefined;
};

export type MaisStackParamList = {
  Menu: undefined;
  Fornecedores: undefined;
  Analises: undefined;
};

export type RootLinkParamList = AuthStackParamList & AppTabParamList;
