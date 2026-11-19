package br.com.intellistock.intellistock_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

/**
 * Título: Classe principal: liga o servidor
 * Explicação: Classe principal do backend, a única com o método main. É o ponto de partida do programa:
 *   quando o servidor é ligado (mvnw spring-boot:run), o Java executa esta classe primeiro.
 */
@SpringBootApplication
@ConfigurationPropertiesScan
public class IntellistockBackendApplication {

	/**
	 * Título: É o primeiro código executado
	 * Explicação: Recebe args (String[]). Main() chama SpringApplication.run, que liga o Spring Boot. Não
	 *   devolve nada.
	 */
	public static void main(String[] args) {
		SpringApplication.run(IntellistockBackendApplication.class, args);
	}

}
