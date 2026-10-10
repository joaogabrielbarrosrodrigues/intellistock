package br.com.intellistock.intellistock_backend.util;

import java.util.regex.Pattern;

/**
 * Normalizacao e validacao de CNPJ, incluindo o formato alfanumerico
 * (12 caracteres [0-9A-Z] seguidos de 2 digitos verificadores).
 */
public final class CnpjUtils {

    private static final Pattern FORMATO = Pattern.compile("[0-9A-Z]{12}[0-9]{2}");
    private static final int[] PESOS_DV1 = {5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
    private static final int[] PESOS_DV2 = {6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};

    private CnpjUtils() {
    }

    /**
     * Remove pontuacao e espacos. Retorna null para valores vazios.
     */
    public static String normalize(String cnpj) {
        if (cnpj == null) {
            return null;
        }
        String normalized = cnpj.replaceAll("[.\\-/\\s]", "").toUpperCase();
        return normalized.isEmpty() ? null : normalized;
    }

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

    private static int digitoVerificador(String cnpj, int[] pesos) {
        int soma = 0;
        for (int i = 0; i < pesos.length; i++) {
            soma += (cnpj.charAt(i) - '0') * pesos[i];
        }
        int resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    }
}
