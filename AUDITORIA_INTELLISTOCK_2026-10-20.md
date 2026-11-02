# IntelliStock — auditoria e primeira etapa

Data: 20/10/2026. Escopo: leitura do frontend Expo/React Native, API Spring Boot e testes existentes; implementação incremental sem alterar banco nem dados reais. A validação visual e funcional em iPhone físico ainda depende de teste pelo usuário com o novo bundle.

## Estado encontrado

- O mobile já possui cinco abas, tokens de cor/espaçamento, componentes compartilhados, safe area nas telas, tratamento de carregamento/erro/vazio, confirmações para exclusões e React Query com invalidação após mutações. Os formulários já usam teclados numéricos em campos relevantes e desabilitam o botão enquanto a mutação está pendente.
- O backend já valida quantidades, impede saldo negativo, salva movimentação e saldo na mesma transação, bloqueia a linha do produto para saídas concorrentes e preserva histórico ao desativar produtos. Contas vencidas são um status calculado pela data. O consumo mensal é separado por unidade de medida.
- A API autentica com JWT, mas `register` é público e os dados de produtos, fornecedores, estoque e contas não têm vínculo com usuário ou estabelecimento. Qualquer usuário autenticado acessa a mesma base. Isso pode ser intencional para **uma única loja com equipe compartilhada**, mas não é seguro para estabelecimentos independentes. Não há autorização por função.
- As listas mobile usam `ScrollView` com `map` e as APIs retornam listas inteiras. Em catálogos grandes, isso limita desempenho. A barra inferior tem altura fixa; precisa de conferência em aparelhos com indicador de início/áreas seguras. Nenhum desses pontos justifica reescrever a navegação nesta etapa.
- O cálculo de reposição é coerente com a fórmula implementada, mas antes a tela não exibia a base de consumo que realmente dirigia a sugestão, o prazo, a cobertura e a segurança. Não há medição de representatividade do histórico. A estimativa não deve ser tratada como pedido automático.

## Auditoria do exemplo “Café Seu João”

A regra atual usa a média dos últimos 30 dias, **ou a média da metade recente se houver tendência de ALTA**, escolhendo a maior. Um cenário com 400 UN de saída na quinzena recente, 0 na antiga, saldo 100 UN e mínimo cadastrado não superior a 186,669 UN reproduz os números vistos:

```text
média de 30 dias = 400 / 30 = 13,333 UN/dia (escala de 3 casas)
base por alta recente = 400 / 15 = 26,667 UN/dia
segurança = max(mínimo cadastrado, 26,667 × 7) = 186,669 UN
ponto de pedido = 26,667 × 7 + 186,669 = 373,338 UN
necessidade = 26,667 × (30 + 7) + 186,669 − 100 = 1.073,348 UN
compra sugerida = 1.074 UN (arredondamento para cima de UN)
custo estimado = 1.074 × R$ 25,90 = R$ 27.816,60
```

O teste automatizado reproduz esse cenário. **Não consultei o registro real nem seu histórico no PostgreSQL**: a composição efetiva das saídas e o mínimo desse produto ainda precisam ser conferidos. Uma alta pontual pode elevar demais a recomendação; mudar a fórmula ou limitar compras exige validação da regra com a equipe de negócio.

## Diagnóstico priorizado

Complexidade e risco são estimativas relativas. “Feito” significa alteração implementada e verificada automaticamente, não validação física no aparelho.

| Prioridade | Problema comprovado | Solução e benefício | Complexidade / risco | Módulos afetados | Estado |
|---|---|---|---|---|---|
| P0 | Cadastro público + mesma base para todos os usuários autenticados. | Definir se o produto atende uma loja compartilhada ou múltiplas lojas; então restringir convites/cadastro e aplicar autorização ou isolamento por estabelecimento. Protege estoque e dados financeiros. | Alta / alta, requer decisão de produto e migração planejada. | `SecurityConfig`, `AuthController`, entidades, repositórios, serviços e testes de acesso. | Pendente; não expor a usuários externos. |
| P0 | POST de movimentação não tem chave de idempotência. Um timeout depois de gravar e novo envio pode duplicar entrada/saída. | Adicionar identificador de operação gerado no cliente e unicidade no servidor; permitir repetição segura após falha de rede. | Média / média, requer contrato e persistência novos. | `MovimentacaoController/Service`, entidade, banco, API mobile. | Pendente; o bloqueio de toque duplo é apenas mitigação local. |
| P1 | Sugestão de compra opaca, especialmente quando a tendência recente aumenta a base. | Retornar parâmetros efetivos no contrato e explicar cálculo, duração estimada, custo e incerteza na tela. Permite revisão informada antes de comprar. | Baixa / baixa. | `AnaliseService`, `ReposicaoResponse`, `ReposicaoCard`, tipos mobile. | Feito. |
| P1 | Movimentação podia ser acionada repetidamente antes de React atualizar o estado; unidade e saldo confirmado pouco claros. | Trava síncrona por envio, quantidade com até 3 casas, unidade no campo e retorno do saldo informado pela API. Reduz erros de lançamento. | Baixa / baixa. | `MovimentacaoModal`. | Feito; não substitui idempotência do servidor. |
| P1 | Histórico curto ou sem saídas não é qualificado pela análise; um único evento pode produzir extrapolação elevada. | Exibir ausência de consumo e aviso de alta recente; depois acrescentar data inicial/número de dias observados e critério de confiança sem alterar a fórmula às cegas. | Média / média. | Consulta de movimentações, `AnaliseService`, tela de análise. | Avisos básicos feitos; medição de confiança pendente. |
| P1 | Barra inferior com altura fixa e listas montadas em `ScrollView`. | Verificar inset inferior e leitura por VoiceOver/TalkBack no iPhone/Android; virtualizar listas e paginar APIs quando houver volume. Evita corte de ações e lentidão. | Média / média. | `RootNavigator`, `Screen`, telas de listagem, controllers. | Pendente; requer teste em aparelho e dados volumosos. |
| P1 | Validações em formulários são majoritariamente no envio; datas e valores são texto livre. | Mensagens por campo, máscaras leves/seleção de data e prevenção uniforme de reenvio. Reduz correção de erros e dúvidas. | Média / baixa a média. | Formulários mobile, `TextField`, validações da API. | Pendente; manter validação crítica no backend. |
| P1 | Contas podem ser excluídas definitivamente e não registram histórico de alterações ou operador. | Definir política de retenção, privilegiar cancelamento e registrar trilha auditável para pagamento/reabertura. Melhora rastreabilidade financeira. | Média a alta / alta, envolve dados existentes. | `ContaPagarService`, entidade, API e tela `Contas`. | Pendente; exige decisão antes de alterar dados. |
| P1 | Dashboard mostra indicadores, mas não liga alertas a ações rápidas; telas extensas exigem navegação manual. | Adicionar navegação contextual para estoque crítico, contas vencidas e reposições, após validar prioridades no telefone. Acelera a rotina. | Média / baixa. | `DashboardScreen`, navegação, telas-alvo. | Pendente. |
| P1 | App no telefone depende do IP do backend; `localhost` só funciona no próprio computador. | Manter `EXPO_PUBLIC_API_URL` explícita por ambiente e testar conectividade na mesma rede ou URL segura. Evita falha aparente de login/API. | Baixa / baixa. | `mobile/src/config/env.ts`, documentação/deploy. | Documentado; configuração de rede depende do ambiente. |
| P2 | Falta lista revisável de compras, categorias, relatórios focados e massa de demonstração separada. | Priorizar após estabilizar segurança e fluxos; nunca gerar compra real automaticamente nem misturar dados de apresentação com dados reais. | Média a alta / variável. | Mobile, API e eventualmente esquema de dados. | Futuro. |

## Primeira etapa aplicada

- Campos **aditivos** na resposta `GET /api/analises/reposicao`: total consumido, janela, cobertura, prazo de entrega e dias de segurança. Campos anteriores, parâmetros de entrada, fórmula e ordenação foram preservados.
- Cartão de reposição com prioridade em linguagem operacional, estoque/ponto de pedido, duração aproximada, quantidade e custo, detalhes expansíveis da conta e alerta quando não houve consumo ou houve alta recente. A lista de consumo distingue produtos ativos sem saídas de histórico real.
- Lançamento de estoque com trava imediata contra dois toques, validação de até três casas decimais, unidade explícita e mensagem de sucesso com saldo confirmado pelo servidor.
- Testes de integração da resposta e do exemplo numérico; documentação do contrato atualizada. Nenhum pacote foi adicionado, não houve migração de esquema, alteração de dados ou mudança na fórmula.

## Verificações e limites

- `mvn -o -Dmaven.repo.local=... test`: 40 testes, 0 falhas, 0 erros (H2 em memória, perfil `test`). Inclui regras de estoque, contas, autenticação e reposição. Não equivale a teste com PostgreSQL real.
- `npm run typecheck`: passou.
- `npm ls expo-font --all`: uma única versão efetiva, `57.0.4`, compartilhada pelas dependências.
- `npx expo export --platform ios` em modo offline: bundle iOS gerado com sucesso. Não comprova execução no dispositivo.
- `npx expo install --check`: modo offline informou dependências atualizadas, com aviso de confiabilidade limitada; modo online foi bloqueado por acesso de rede. `npx expo-doctor` falhou com `EACCES` ao tentar consultar o registro npm; não há resultado novo de aprovação do doctor nesta etapa.
- Nenhum teste visual/tátil foi executado em iPhone físico nesta etapa. É necessário conferir abas, rolagem, teclado, aviso de análise e lançamento de saída real em uma **base de teste**.
- A árvore Git já continha alterações da migração anterior para Expo SDK 57 em `mobile/package.json`, `mobile/package-lock.json` e `mobile/src/config/env.ts`, além do backup em `tmp/expo-sdk54-recovery/`. Foram preservadas.

## Próxima decisão

Antes de convidar outras pessoas, decidir: **todos são colaboradores da mesma loja** ou **cada loja deve ver apenas seus próprios dados**? O segundo caso exige identificação de estabelecimento, migração sem perda de registros, filtros obrigatórios em todas as consultas e testes de autorização entre contas. Mesmo no primeiro caso, o cadastro público precisa ser substituído por convites ou aprovação controlada.
