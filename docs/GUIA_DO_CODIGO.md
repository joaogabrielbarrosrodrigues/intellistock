# Como explicar o InteliStock

O InteliStock controla produtos, fornecedores, entradas e saídas de estoque e contas a pagar.
Ele também calcula consumo e sugere reposição com fórmulas sobre o histórico de saídas.
Não há modelo de inteligência artificial nem compra automática.

## Caminho de uma operação

```mermaid
flowchart LR
    Tela["Tela React Native"] --> Hook["Hook React Query"]
    Hook --> Cliente["Cliente Axios + JWT"]
    Cliente --> Controller["Controller Spring"]
    Controller --> Service["Service: regras e transação"]
    Service --> Repository["Repository JPA"]
    Repository --> Banco[(PostgreSQL)]
```

O aplicativo roda com React Native e Expo em Android, iOS e web. O mesmo código de tela
chama uma API HTTP em Java. Só a API acessa o banco. As respostas são JSON e os tipos
TypeScript descrevem os contratos usados pelas telas.

## Por onde começar a leitura

| Parte | Arquivos principais | Responsabilidade |
| --- | --- | --- |
| Inicialização | `mobile/App.tsx` | Carrega fontes e instala os provedores de sessão, cache, área segura e mensagens. |
| Navegação | `mobile/src/navigation/RootNavigator.tsx` | Mostra login ou as cinco abas, conforme a sessão. |
| Interface | `mobile/src/screens/` e `components/` | Exibe dados, coleta campos e apresenta carregamento, sucesso ou erro. |
| Consultas | `mobile/src/hooks/useIntellistockQueries.ts` | Consulta/cacheia dados e invalida consultas afetadas após uma gravação. |
| HTTP | `mobile/src/api/client.ts` e `intellistock.ts` | Configura endereço/timeout/token e chama os endpoints. |
| Sessão | `AuthContext.tsx` e `storage/sessionStorage.ts` | Faz login/logout e restaura a sessão persistida. |
| Lembretes | `mobile/src/notifications/` | Planeja e agenda notificações locais de contas. |
| Entrada da API | `intellistock-backend/src/main/java/br/com/intellistock/intellistock_backend/` | Contém controllers, services, repositories, entidades e DTOs. |

No backend, uma **entity** representa uma tabela e seus relacionamentos. Um **DTO**
define os campos de entrada ou saída de um endpoint. O **controller** recebe a requisição,
o **service** decide o que é permitido e o **repository** consulta ou grava os dados.
O Spring injeta essas dependências pelos construtores. O JPA/Hibernate transforma as
operações com entidades em SQL.

## Exemplo completo: registrar uma saída

1. `EstoqueScreen` abre `MovimentacaoModal` com o produto selecionado.
2. O modal valida quantidade, unidade e saldo mostrado. Uma trava impede dois envios simultâneos.
3. `useMovimentacaoMutation` chama `createMovimentacao`, que envia `POST /api/movimentacoes`.
4. O filtro JWT autentica a requisição; `MovimentacaoController` valida o DTO.
5. `MovimentacaoService` abre uma transação e bloqueia a linha do produto durante a alteração.
6. O serviço verifica produto ativo e saldo suficiente, altera a quantidade e grava a movimentação.
7. Se uma regra falhar, a transação é desfeita; saldo e histórico não ficam parcialmente gravados.
8. A resposta contém o saldo confirmado. O React Query invalida estoque, produtos, histórico,
   dashboard e análises; as telas afetadas buscam os novos dados.

A validação da tela ajuda o usuário, mas a API repete as verificações porque requisições
podem chegar de outros clientes e o saldo pode mudar enquanto o formulário está aberto.
O bloqueio protege lançamentos concorrentes. Ainda não existe chave de idempotência:
se uma conexão cair depois da gravação, confira o histórico antes de reenviar.

## Autenticação

`POST /api/auth/login` verifica e-mail e senha. O banco guarda um hash BCrypt, nunca a senha
original. A API devolve um JWT assinado com validade limitada. O Axios envia esse token
no cabeçalho `Authorization: Bearer ...` nas consultas seguintes.

No celular a sessão fica no SecureStore; na web, no armazenamento local do navegador.
Se a persistência estiver indisponível, o login funciona enquanto o aplicativo permanece
aberto. Uma resposta 401 da sessão atual encerra o acesso; uma resposta atrasada de um
login antigo não encerra uma sessão nova.

**Modelo atual:** os usuários autenticados compartilham o mesmo estoque e as mesmas contas.
Não há separação por empresa ou permissões por cargo. O cadastro de usuário existe na API;
a interface oferece login. Isso deve ficar claro ao apresentar o projeto.

## Estoque e histórico

- Produto tem quantidade atual, estoque mínimo, unidade, preço e fornecedor opcional.
- Uma quantidade inicial maior que zero gera uma entrada no histórico. Depois disso, saldo muda por movimentações.
- Saída maior que o saldo é recusada. Quantidades têm até três casas decimais.
- Produto é desativado para preservar histórico. A unidade não pode ser trocada quando já há movimentações.
- Fornecedor vinculado a produtos ou contas não pode ser excluído.

## Contas a pagar

Uma conta tem fornecedor obrigatório, descrição, valor e vencimento. Os estados gravados
são `PENDENTE`, `PAGA` e `CANCELADA`. `VENCIDA` é calculado: uma conta pendente cujo vencimento
é anterior ao dia atual. Por isso uma conta pode aparecer vencida sem uma rotina gravando
esse estado diariamente.

Pagar, cancelar e reabrir passam por regras no `ContaPagarService`. As alterações de uma
mesma conta são serializadas por bloqueio no banco. Os valores monetários usam `BigDecimal`
no Java e duas casas decimais; quantidades de estoque usam três.

## Consumo e reposição

Consumo considera apenas **saídas**, dentro da janela consultada (30 dias por padrão).
A média diária divide o total pelos dias; a semanal multiplica por 7 e a mensal por 30.
A tendência compara as médias da metade recente e da metade antiga da janela.
Uma variação de pelo menos 10% indica alta; de no máximo -10%, baixa.
Se a metade antiga não teve consumo e a recente teve, a tendência é alta, sem percentual
de variação calculável. Uma janela de apenas um dia é classificada como estável.

Na reposição, a base é a média diária, usando a maior entre ela e a média recente quando
há tendência de alta. Com os parâmetros padrão:

```text
segurança = maior entre mínimo cadastrado e consumoBase × 7 dias
ponto de pedido = consumoBase × 7 dias de entrega + segurança
necessidade = consumoBase × (30 dias de cobertura + 7 de entrega) + segurança − saldo
```

O sistema recomenda reposição quando o saldo é menor ou igual ao ponto de pedido
e a necessidade calculada é maior que zero.
A quantidade sugerida nunca é negativa e é arredondada para cima: inteiro para `UN`,
`CX`, `PCT` e `FD`; até três casas para medidas contínuas. O custo estimado é quantidade
sugerida vezes preço cadastrado.

Exemplo estável: média de 2 UN/dia, mínimo 10 e saldo 20. A segurança é 14, o ponto
de pedido é 28 e a necessidade é `2 × 37 + 14 − 20 = 68 UN`.
Sem saídas, a base é zero e a sugestão só busca atingir o mínimo cadastrado.
O cálculo não reconhece sazonalidade nem distingue uma venda pontual de uma alta sustentável.

O dashboard separa séries por unidade. Somar 10 litros com 5 quilos não produziria
um indicador de quantidade válido.

## Notificações e atualização

Os avisos de contas são locais, agendados para 7 dias antes, 3 dias antes e o dia do
vencimento às 9h do aparelho. A fila tem no máximo 60 avisos. Contas pagas/canceladas
deixam de ter avisos futuros na próxima sincronização. Não existe servidor enviando
push: alterações feitas em outro aparelho só chegam quando este aplicativo atualiza os dados.
Na web, o fluxo de notificações locais não está disponível.

## Como demonstrar que funciona

Os testes de integração Java usam MockMvc e H2 em memória para exercitar HTTP,
persistência e regras; o teste de concorrência usa duas transações reais sobre H2.
Há também testes unitários de JWT e CNPJ. Nenhum deles altera o PostgreSQL local.
Os testes Node verificam regras de lembretes, campos
decimais, datas e tratamento de 401. TypeScript verifica os tipos; o export do Expo
verifica se o aplicativo pode ser empacotado para cada plataforma.

Essas verificações não substituem testes de toque, teclado, conexão de rede, layout e
notificações no aparelho. Use o [checklist manual](../CHECKLIST_APRESENTACAO_MOBILE.md).

Uma forma de apresentar: explicar o problema → mostrar a arquitetura → cadastrar um
produto → registrar entrada/saída → conferir saldo e análise → pagar uma conta → explicar
quais regras ficaram no backend e como os testes as verificam.
