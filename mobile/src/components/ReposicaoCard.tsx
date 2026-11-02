import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import type { Reposicao } from "../api/types";
import { colors } from "../theme/colors";
import { radius, spacing } from "../theme/tokens";
import { formatCurrency, formatQuantity } from "../utils";
import { Card, StatusBadge } from "./ui";
import { AppText as Text } from "./AppText";

const priorityLabels = {
  ALTA: "Risco de ruptura",
  MEDIA: "Estoque crítico",
  BAIXA: "Planejar compra",
  NENHUMA: "Sem reposição"
} as const;

export function ReposicaoCard({ item }: { item: Reposicao }) {
  const [expanded, setExpanded] = useState(false);
  const unit = item.unidadeMedida;
  const days = item.diasRestantes == null
    ? "Sem estimativa de duração"
    : `Duração estimada: ${item.diasRestantes.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} dia(s)`;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text numberOfLines={2} style={styles.title}>{item.produtoNome}</Text>
        <StatusBadge
          label={priorityLabels[item.prioridade]}
          tone={item.prioridade === "ALTA" ? "danger" : item.prioridade === "MEDIA" ? "warning" : "primary"}
        />
      </View>
      {item.fornecedor ? <Text style={styles.secondary}>{item.fornecedor.nome}</Text> : null}
      <Text style={styles.secondary}>
        Estoque: {formatQuantity(item.estoqueAtual, unit)} · ponto de pedido: {formatQuantity(item.pontoPedido, unit)}
      </Text>
      <Text style={styles.secondary}>{days}</Text>
      <View style={styles.result}>
        <View style={styles.resultText}>
          <Text style={styles.resultLabel}>Compra sugerida</Text>
          <Text style={styles.quantity}>{formatQuantity(item.quantidadeSugerida, unit)}</Text>
        </View>
        <View style={styles.costText}>
          <Text style={styles.resultLabel}>Custo estimado</Text>
          <Text style={styles.cost}>{formatCurrency(item.custoEstimado)}</Text>
        </View>
      </View>
      {item.totalConsumido === 0 ? (
        <Text style={styles.warning}>Sem saídas nos últimos {item.periodoAnaliseDias} dias. A sugestão usa o estoque mínimo, sem previsão de demanda.</Text>
      ) : item.tendencia === "ALTA" ? (
        <Text style={styles.warning}>A alta recente elevou a base de consumo. Confira se esse ritmo vai continuar antes de comprar.</Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((value) => !value)}
        style={styles.detailsButton}
      >
        <Text style={styles.detailsButtonText}>{expanded ? "Ocultar cálculo" : "Entender sugestão"}</Text>
      </Pressable>
      {expanded ? (
        <View style={styles.details}>
          <Text style={styles.detail}>Consumo: {formatQuantity(item.totalConsumido, unit)} em {item.periodoAnaliseDias} dias.</Text>
          <Text style={styles.detail}>Média diária: {formatQuantity(item.consumoMedioDiario, unit)}; base usada: {formatQuantity(item.consumoBaseDiario, unit)} por dia{item.tendencia === "ALTA" ? " (média recente maior)" : ""}.</Text>
          <Text style={styles.detail}>Prazo de entrega: {item.prazoEntregaDias} dias; cobertura planejada: {item.diasCobertura} dias.</Text>
          <Text style={styles.detail}>Segurança: {formatQuantity(item.estoqueSeguranca, unit)} (maior entre mínimo cadastrado de {formatQuantity(item.estoqueMinimoCadastrado, unit)} e {item.diasSeguranca} dias de consumo).</Text>
          <Text style={styles.formula}>A sugestão considera o consumo esperado até a próxima compra, uma reserva de segurança e o que já há em estoque.</Text>
          <Text style={styles.disclaimer}>Estimativa baseada nas saídas registradas. Revise períodos atípicos e histórico incompleto antes de comprar.</Text>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.xs },
  header: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, justifyContent: "space-between" },
  title: { color: colors.text, flexGrow: 1, flexShrink: 1, fontSize: 17, fontWeight: "800" },
  secondary: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
  result: { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, justifyContent: "space-between", marginTop: spacing.xs, paddingTop: spacing.sm },
  resultText: { flexGrow: 1 },
  costText: { alignItems: "flex-start", flexGrow: 1 },
  resultLabel: { color: colors.muted, fontSize: 12 },
  quantity: { color: colors.primaryDark, fontSize: 18, fontWeight: "800" },
  cost: { color: colors.text, fontSize: 16, fontWeight: "800" },
  warning: { backgroundColor: colors.warningLight, borderRadius: radius.sm, color: colors.warning, fontSize: 13, lineHeight: 19, padding: spacing.sm },
  detailsButton: { alignSelf: "flex-start", justifyContent: "center", minHeight: 44, paddingRight: spacing.md },
  detailsButtonText: { color: colors.primary, fontSize: 14, fontWeight: "800" },
  details: { backgroundColor: colors.surfaceMuted, borderRadius: radius.md, gap: spacing.xs, padding: spacing.sm },
  detail: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  formula: { color: colors.text, fontSize: 13, fontWeight: "700", lineHeight: 19 },
  disclaimer: { color: colors.muted, fontSize: 12, lineHeight: 18 }
});
