/**
 * Título: Espaçamentos, cantos e sombras
 * Explicação: Arquivo de tema com as medidas padrão.
 */
export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 36
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  pill: 999
} as const;

export const shadow = {
  card: {
    elevation: 2,
    shadowColor: "#10201E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8
  }
} as const;
