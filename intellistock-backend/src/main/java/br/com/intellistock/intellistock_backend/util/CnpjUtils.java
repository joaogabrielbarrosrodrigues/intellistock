package br.com.intellistock.intellistock_backend.util;

import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Título: Ferramentas para limpar e validar CNPJ
 * Explicação: Classe utilitária (só métodos estáticos, sem Spring) para tratar CNPJ, inclusive o formato
 *   novo com letras.
 *
 * Normalizacao e validacao de CNPJ, incluindo o formato alfanumerico
 * (12 caracteres [0-9A-Z] seguidos de 2 digitos verificadores).
 */
public final class CnpjUtils {

    private static final Pattern FORMATO = Pattern.compile("[0-9A-Z]{12}[0-9]{2}");
    private static final int[] PESOS_DV1 = {5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
    private static final int[] PESOS_DV2 = {6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};

    /**
     * Título: Construtor
     * Explicação: Construtor privado: impede criar objetos desta classe, que só tem métodos estáticos.
     */
    private CnpjUtils() {
    }

    /**
     * Título: Remove pontos, barra, traço e espaços e põe em maiúsculas
     * Explicação: Recebe cnpj (String). Tira pontos, barra, traço e espaços e põe em maiúsculas; texto vazio
     *   vira null. Devolve String.
     *
     * Remove pontuacao e espacos. Retorna null para valores vazios.
     */
    public static String normalize(String cnpj) {
        if (cnpj == null) {
            return null;
        }
        String normalized = cnpj.replaceAll("[.\\-/\\s]", "").toUpperCase(Locale.ROOT);
        return normalized.isEmpty() ? null : normalized;
    }

    /**
     * Título: Confere o formato e os dois dígitos verificadores
     * Explicação: Recebe normalizedCnpj (String). Confere o formato (12 caracteres + 2 dígitos), recusa todos
     *   iguais e confere os dois dígitos verificadores. Devolve boolean.
     */
    public static boolean isValid(String normalizedCnpj) {
        if (normalizedCnpj == null || !FORMATO.matcher(normalizedCnpj).matches()) {
            return false;
        }
        if (normalizedCnpj.chars().distinct().count() == 1) {
            return false;
        }
        int dv1 = digitoVerificador(normalizedCnpj, PESOS_DV1);
        int dv2 = digitoVerificador(normalizedCnpj, PESOS_DV2);
        return dv1 == normalizedCnpj.charAt(12) - '0' && dv2 == normalizedCnpj.charAt(13) - '0';
    }

    /**
     * Título: Calcula um dígito verificador pela soma ponderada módulo 11
     * Explicação: Recebe cnpj (String) e pesos (int[]). Soma ponderada pelos pesos da Receita Federal e regra
     *   do módulo 11. Devolve int.
     */
    private static int digitoVerificador(String cnpj, int[] pesos) {
        int soma = 0;
        for (int i = 0; i < pesos.length; i++) {
            soma += (cnpj.charAt(i) - '0') * pesos[i];
        }
        int resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    }
}
