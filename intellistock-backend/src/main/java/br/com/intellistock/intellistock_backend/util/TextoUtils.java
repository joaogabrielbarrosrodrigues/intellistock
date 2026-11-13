package br.com.intellistock.intellistock_backend.util;

import java.util.Locale;

/**
 * Normalizacoes de texto aplicadas antes de gravar ou consultar dados.
 */
public final class TextoUtils {

    private TextoUtils() {
    }

    /**
     * Remove espacos nas pontas. Retorna null para valores nulos ou vazios.
     */
    public static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    /**
     * E-mails sao gravados e consultados sem espacos nas pontas e em minusculas.
     */
    public static String normalizarEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
