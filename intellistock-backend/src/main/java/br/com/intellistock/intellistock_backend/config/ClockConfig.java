package br.com.intellistock.intellistock_backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

/**
 * Título: Relógio do sistema usado pelos services
 * Explicação: Classe de configuração que fornece o relógio do sistema como um bean do Spring. Os services
 *   perguntam a data e a hora a este relógio em vez de usar LocalDate.now() direto.
 */
@Configuration
public class ClockConfig {

    /**
     * Título: Cria o relógio padrão do sistema, no fuso horário do computador
     * Explicação: Clock() cria o relógio padrão do computador, no fuso horário local. Devolve Clock.
     */
    @Bean
    public Clock clock() {
        return Clock.systemDefaultZone();
    }
}
