/**
 * Título: Espera o usuário parar de digitar
 * Explicação: Hook utilitário que atrasa um valor até ele parar de mudar.
 */
import { useEffect, useState } from "react";

/**
 * Título: Devolve o valor só depois da pausa
 * Explicação: Usado por FornecedoresScreen e ProdutosScreen.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs, value]);

  return debounced;
}
