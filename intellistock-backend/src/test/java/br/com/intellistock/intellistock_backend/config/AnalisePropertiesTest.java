package br.com.intellistock.intellistock_backend.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.context.properties.bind.validation.BindValidationException;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Configuration;

import static org.assertj.core.api.Assertions.assertThat;

class AnalisePropertiesTest {
    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withUserConfiguration(Configuracao.class);

    @Configuration(proxyBeanMethods = false)
    @EnableConfigurationProperties(AnaliseProperties.class)
    static class Configuracao {}

    @Test
    void carregaPadroesValidos() {
        runner.run(context -> {
            assertThat(context).hasNotFailed();
            assertThat(context.getBean(AnaliseProperties.class))
                    .isEqualTo(new AnaliseProperties(30, 30, 7, 7, 10));
        });
    }

    @Test
    void rejeitaConfiguracaoInvalidaAntesDeExecutarCalculos() {
        for (String propriedade : new String[]{
                "dias-analise=0", "dias-analise=366", "dias-cobertura=0", "dias-cobertura=366",
                "prazo-entrega-dias=-1", "prazo-entrega-dias=366", "dias-seguranca=-1",
                "dias-seguranca=366", "limiar-tendencia-percentual=0"}) {
            runner.withPropertyValues("app.analise." + propriedade)
                    .run(context -> {
                        assertThat(context).hasFailed();
                        assertThat(context.getStartupFailure()).hasRootCauseInstanceOf(BindValidationException.class);
                    });
        }
    }

    @Test
    void aceitaEntregaESegurancaZeradas() {
        runner.withPropertyValues("app.analise.prazo-entrega-dias=0", "app.analise.dias-seguranca=0")
                .run(context -> {
                    assertThat(context).hasNotFailed();
                    assertThat(context.getBean(AnaliseProperties.class).prazoEntregaDias()).isZero();
                    assertThat(context.getBean(AnaliseProperties.class).diasSeguranca()).isZero();
                });
    }
}
