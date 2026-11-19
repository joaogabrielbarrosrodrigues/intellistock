/**
 * Título: Tela de análise e reposição
 * Explicação: Tela de análise e reposição, aberta pela aba Mais.
 */
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, View } from "react-native";
import { getApiErrorMessage } from "../api/errors";
import { EmptyState } from "../components/EmptyState";
import { AppText as Text } from "../components/AppText";
import { BackHeader } from "../components/BackHeader";
import { ReposicaoCard } from "../components/ReposicaoCard";
import { Screen } from "../components/Screen";
import { Card, SectionTitle, StatusBadge } from "../components/ui";
import { StateView } from "../components/StateView";
import { useConsumoQuery, useReposicoesQuery } from "../hooks/useIntellistockQueries";
import type { MaisStackParamList } from "../navigation/types";
import { colors } from "../theme/colors";
import { spacing } from "../theme/tokens";
import { formatQuantity } from "../utils";

/**
 * Título: Tela de análise e reposição (componente AnalisesScreen)
 * Explicação: Busca ao mesmo tempo as sugestões de reposição e a análise de consumo. Mostra um
 *   ReposicaoCard para cada produto que precisa de compra. Mostra o consumo de cada produto que teve
 *   saídas: total no período, média diária e tendência. Usado por RootNavigator.
 */
export function AnalisesScreen({ navigation }: NativeStackScreenProps<MaisStackParamList, "Analises">) {
  const consumo = useConsumoQuery();
  const reposicoes = useReposicoesQuery();
  const loading = consumo.isLoading || reposicoes.isLoading;
  const error = consumo.isError
    ? getApiErrorMessage(consumo.error, "Não foi possível carregar a análise de consumo.")
    : reposicoes.isError
      ? getApiErrorMessage(reposicoes.error, "Não foi possível carregar as sugestões de reposição.")
      : null;
  const consumed = (consumo.data ?? []).filter((item) => item.totalConsumido > 0);
  /**
   * Título: Recarrega as duas consultas
   * Explicação: Chama refetch() das duas consultas: GET /api/analises/consumo e GET
   *   /api/analises/reposicao.
   */
  const retry = () => {
    void consumo.refetch();
    void reposicoes.refetch();
  };

  return (
    <Screen refreshing={consumo.isRefetching || reposicoes.isRefetching} onRefresh={retry}>
      {/*
        Título: Cabeçalho com voltar
        Explicação: A seta chama navigation.goBack() e volta para o menu Mais.
      */}
      <BackHeader
        onBack={() => navigation.goBack()}
        subtitle="Baseado no histórico real"
        title="Análise e reposição"
      />
      {/*
        Título: Carregando / erro das análises
        Explicação: Junta os estados de GET /api/analises/consumo e GET /api/analises/reposicao. Tentar
          novamente chama retry(), que repete as duas chamadas.
      */}
      <StateView error={error} loading={loading} onRetry={retry} />
      {!loading && !error ? (
        <>
          {/*
            Título: Sugestões de reposição
            Explicação: Um ReposicaoCard por produto, vindos de useReposicoesQuery() → getReposicoes() → GET
              /api/analises/reposicao (AnaliseController.reposicao).
          */}
          <SectionTitle title="Sugestões de reposição" />
          {(reposicoes.data ?? []).length === 0 ? (
            <EmptyState
              message="Nenhum produto precisa de reposição neste momento."
              title="Estoque sob controle"
            />
          ) : (
            (reposicoes.data ?? []).map((item) => (
              <ReposicaoCard key={item.produtoId} item={item} />
            ))
          )}
          {/*
            Título: Consumo por produto
            Explicação: Cartões com total consumido, tendência e média diária, vindos de useConsumoQuery() →
              getConsumo() → GET /api/analises/consumo (AnaliseController.consumo). Só aparecem produtos com
              consumo maior que zero.
          */}
          <SectionTitle title="Consumo por produto" />
          {consumed.length === 0 ? (
            <EmptyState
              message="Registre saídas para calcular os indicadores de consumo."
              title="Ainda sem histórico de consumo"
            />
          ) : (
            consumed.map((item) => (
              <Card key={item.produtoId} style={styles.analysisCard}>
                <View style={styles.analysisHeader}>
                  <Text numberOfLines={1} style={styles.analysisTitle}>
                    {item.produtoNome}
                  </Text>
                  <StatusBadge
                    label={item.tendencia}
                    tone={
                      item.tendencia === "ALTA"
                        ? "warning"
                        : item.tendencia === "BAIXA"
                          ? "primary"
                          : "neutral"
                    }
                  />
                </View>
                <Text style={styles.analysisMeta}>
                  {formatQuantity(item.totalConsumido, item.unidadeMedida)} consumidos em{" "}
                  {item.periodoDias} dias
                </Text>
                <Text style={styles.suggestion}>
                  Média diária: {formatQuantity(item.mediaDiaria, item.unidadeMedida)}
                </Text>
              </Card>
            ))
          )}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  analysisCard: { gap: spacing.xs },
  analysisHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "space-between"
  },
  analysisTitle: { color: colors.text, flex: 1, fontSize: 16, fontWeight: "800" },
  analysisMeta: { color: colors.muted, fontSize: 13 },
  suggestion: { color: colors.primaryDark, fontWeight: "800" }
});
