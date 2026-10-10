package br.com.intellistock.intellistock_backend.util;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class CnpjUtilsTest {

    @Test
    void normalizaRemovendoPontuacao() {
        assertThat(CnpjUtils.normalize("11.222.333/0001-81")).isEqualTo("11222333000181");
        assertThat(CnpjUtils.normalize("12.abc.345/01de-35")).isEqualTo("12ABC34501DE35");
        assertThat(CnpjUtils.normalize("  ")).isNull();
        assertThat(CnpjUtils.normalize(null)).isNull();
    }

    @Test
    void aceitaCnpjNumericoEAlfanumericoValidos() {
        assertThat(CnpjUtils.isValid("11222333000181")).isTrue();
        assertThat(CnpjUtils.isValid("12ABC34501DE35")).isTrue();
    }

    @Test
    void recusaCnpjInvalido() {
        assertThat(CnpjUtils.isValid("11222333000180")).isFalse();
        assertThat(CnpjUtils.isValid("00000000000000")).isFalse();
        assertThat(CnpjUtils.isValid("1122233300018")).isFalse();
        assertThat(CnpjUtils.isValid("12ABC34501DE3A")).isFalse();
    }
}
