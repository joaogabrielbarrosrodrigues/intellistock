# InteliStock — Back-end

API REST do InteliStock em **Java 21 + Spring Boot 4**, com Spring Security/JWT, Spring Data JPA e PostgreSQL.

## Como rodar

Pré-requisitos: JDK 21 e um PostgreSQL com o banco `intellistock` criado.

```bash
cd intellistock-backend

# testes (usam H2 em memória, não precisam do PostgreSQL)
./mvnw test

# aplicação (Linux/macOS)
DB_PASSWORD=sua_senha JWT_SECRET=um-segredo-com-pelo-menos-32-caracteres ./mvnw spring-boot:run
```

No PowerShell do Windows:

```powershell
$env:DB_PASSWORD="sua_senha"
$env:JWT_SECRET="um-segredo-com-pelo-menos-32-caracteres"
$env:SPRING_PROFILES_ACTIVE="dev"
.\mvnw.cmd spring-boot:run
```

O perfil `dev` permite criar/atualizar o schema local (`ddl-auto=update`). Sem esse perfil, o padrão é
`ddl-auto=validate`, para impedir alterações automáticas em bases compartilhadas. A API sobe em
`http://localhost:8080`.

### Variáveis de ambiente

| Variável                 | Padrão                                         | Descrição                                     |
|--------------------------|------------------------------------------------|-----------------------------------------------|
| `DB_URL`                 | `jdbc:postgresql://localhost:5432/intellistock` | URL JDBC do banco                             |
| `DB_USERNAME`            | `postgres`                                     | Usuário do banco                              |
| `DB_PASSWORD`            | —                                              | Senha do banco (obrigatória)                  |
| `JWT_SECRET`             | segredo de desenvolvimento                     | **Troque em produção** (mín. 32 caracteres)   |
| `JWT_EXPIRATION_MINUTES` | `120`                                          | Validade do token                             |
| `CORS_ALLOWED_ORIGINS`   | `*`                                            | Origens liberadas, separadas por vírgula      |
| `SHOW_SQL`               | `false`                                        | Exibe o SQL gerado no log                     |

Os parâmetros padrão da análise de reposição ficam em `application.properties` (`app.analise.*`).

## Estrutura

```text
src/main/java/br/com/intellistock/intellistock_backend/
├── config/      SecurityConfig (JWT, CORS), AnaliseProperties, Clock
├── controller/  Endpoints REST
├── dto/         Requests e responses (as entidades nunca são expostas diretamente)
├── entity/      User, Produto, Fornecedor, Movimentacao, ContaPagar + enums
├── exception/   Exceções de negócio e handler global (erros em JSON padronizado)
├── repository/  Spring Data JPA
├── security/    Geração/validação de JWT, filtro e respostas 401/403 em JSON
├── service/     Regras de negócio
└── util/        Validação de CNPJ
```

## Autenticação

Todos os endpoints, exceto `register` e `login`, exigem o header:

```http
Authorization: Bearer <token>
```

| Método | Endpoint             | Descrição                         |
|--------|----------------------|-----------------------------------|
| POST   | `/api/auth/register` | Cadastra usuário                  |
| POST   | `/api/auth/login`    | Retorna o token JWT               |
| GET    | `/api/users/me`      | Dados do usuário autenticado      |

```json
// POST /api/auth/register
{ "nome": "Joao Gabriel", "email": "joao@example.com", "senha": "senha1234" }

// POST /api/auth/login  →  { "token": "...", "tokenType": "Bearer", "user": { ... } }
{ "email": "joao@example.com", "senha": "senha1234" }
```

## Fornecedores

| Método | Endpoint                 | Descrição                                               |
|--------|--------------------------|---------------------------------------------------------|
| GET    | `/api/fornecedores`      | Lista (filtro opcional `?busca=` por nome)              |
| GET    | `/api/fornecedores/{id}` | Detalhe                                                 |
| POST   | `/api/fornecedores`      | Cadastra                                                |
| PUT    | `/api/fornecedores/{id}` | Atualiza                                                |
| DELETE | `/api/fornecedores/{id}` | Exclui (409 se houver produtos ou contas vinculados)    |

```json
{ "nome": "Laticínios Bom Leite", "cnpj": "11.222.333/0001-81", "telefone": "(11) 99999-0000", "email": "contato@bomleite.com" }
```

O CNPJ é opcional, único, armazenado sem pontuação e validado pelos dígitos verificadores
(aceita também o novo formato alfanumérico).

## Produtos

| Método | Endpoint                       | Descrição                                                         |
|--------|--------------------------------|-------------------------------------------------------------------|
| GET    | `/api/produtos`                | Lista ativos. Filtros: `busca`, `fornecedorId`, `incluirInativos` |
| GET    | `/api/produtos/{id}`           | Detalhe                                                           |
| POST   | `/api/produtos`                | Cadastra                                                          |
| PUT    | `/api/produtos/{id}`           | Atualiza dados cadastrais (não altera o saldo)                    |
| DELETE | `/api/produtos/{id}`           | Exclusão **lógica** (inativa e preserva o histórico)              |
| PATCH  | `/api/produtos/{id}/reativar`  | Reativa um produto inativo                                        |

```json
{
  "nome": "Leite Integral",
  "descricao": "Caixa 1L",
  "quantidadeInicial": 40,
  "estoqueMinimo": 50,
  "unidadeMedida": "L",
  "preco": 4.99,
  "fornecedorId": "uuid-opcional"
}
```

- `unidadeMedida`: `UN`, `KG`, `G`, `L`, `ML`, `M`, `CX`, `PCT`, `FD`.
- `quantidadeInicial` só é usada no cadastro e gera uma movimentação de ENTRADA "Estoque inicial".
  Depois disso o saldo só muda por movimentações.

## Movimentações

| Método | Endpoint                  | Descrição                                                          |
|--------|---------------------------|--------------------------------------------------------------------|
| GET    | `/api/movimentacoes`      | Histórico (mais recentes primeiro). Filtros abaixo                 |
| GET    | `/api/movimentacoes/{id}` | Detalhe                                                            |
| POST   | `/api/movimentacoes`      | Registra ENTRADA ou SAIDA e atualiza o estoque                     |

Filtros do GET: `produtoId`, `tipo` (`ENTRADA`/`SAIDA`), `inicio` e `fim` (`yyyy-MM-dd`), `limite` (padrão 100, máx. 1000).

```json
{ "produtoId": "uuid", "tipo": "SAIDA", "quantidade": 3, "observacao": "Venda balcão" }
```

- `data` é opcional (padrão: agora) e permite lançamentos retroativos; não pode ser futura.
- Saída maior que o saldo retorna **422** com a quantidade disponível.
- Produto inativo não aceita movimentações (**422**).
- O produto é bloqueado (`SELECT ... FOR UPDATE`) durante o registro, então saídas simultâneas
  nunca deixam o estoque negativo. Cada movimentação guarda o `saldoResultante` e o usuário que a registrou.

## Estoque

| Método | Endpoint                   | Descrição                                            |
|--------|----------------------------|------------------------------------------------------|
| GET    | `/api/estoque`             | Posição de todos os produtos ativos                  |
| GET    | `/api/estoque/baixo`       | Produtos com quantidade ≤ estoque mínimo             |
| GET    | `/api/estoque/{produtoId}` | Posição de um produto                                |

Cada item traz `situacao` (`NORMAL`, `BAIXO`, `ZERADO`) e `valorEmEstoque` (quantidade × preço).

## Contas a pagar

| Método | Endpoint                    | Descrição                                       |
|--------|-----------------------------|-------------------------------------------------|
| GET    | `/api/contas`               | Lista (ordenada por vencimento). Filtros abaixo |
| GET    | `/api/contas/{id}`          | Detalhe                                         |
| POST   | `/api/contas`               | Cadastra                                        |
| PUT    | `/api/contas/{id}`          | Atualiza (apenas contas em aberto)              |
| DELETE | `/api/contas/{id}`          | Exclui                                          |
| PATCH  | `/api/contas/{id}/pagar`    | Marca como paga. Body opcional: `{"dataPagamento": "2026-10-10"}` |
| PATCH  | `/api/contas/{id}/cancelar` | Cancela                                         |
| PATCH  | `/api/contas/{id}/reabrir`  | Volta uma conta paga/cancelada para PENDENTE    |

Filtros do GET: `status`, `fornecedorId`, `vencimentoInicio`, `vencimentoFim` (`yyyy-MM-dd`).

```json
{ "fornecedorId": "uuid", "descricao": "Boleto NF 1234", "valor": 1520.90, "dataVencimento": "2026-10-20", "observacao": "Parcela 1/3" }
```

**Status:** `PENDENTE`, `VENCIDA`, `PAGA`, `CANCELADA`. `VENCIDA` não é gravado: é uma conta PENDENTE
com vencimento anterior a hoje. O filtro `status=PENDENTE` retorna só as que ainda não venceram.
A resposta inclui `diasParaVencimento` (negativo quando vencida).

## Análises (inteligência de estoque)

As análises usam o histórico de **SAÍDAS** como consumo.

### `GET /api/analises/consumo`

Parâmetros: `produtoId` (opcional; sem ele retorna todos os ativos) e `dias` (padrão 30).

Retorna `totalConsumido`, `mediaDiaria`, `mediaSemanal` (×7), `mediaMensal` (×30), `mediaDiariaRecente`,
`tendencia` (`ALTA`, `ESTAVEL`, `BAIXA`) e `variacaoPercentual`.

**Tendência:** o período é dividido em duas metades e a média diária da metade recente é comparada com a
da metade antiga. Variação ≥ +10% indica ALTA e ≤ −10% indica BAIXA (limiar configurável).

### `GET /api/analises/consumo/serie`

Série temporal para gráficos. Informe exatamente um dos filtros `produtoId` ou `unidadeMedida`.
Isso impede somar quantidades incompatíveis. Também aceita `agrupamento` (`DIARIO`, `SEMANAL`,
`MENSAL`) e `dias`. A resposta identifica a `unidadeMedida` da série.

### `GET /api/analises/reposicao`

Sugestões de reposição. Parâmetros opcionais (padrões em `app.analise.*`):

| Parâmetro          | Padrão | Significado                                     |
|--------------------|--------|-------------------------------------------------|
| `dias`             | 30     | Janela de histórico para o consumo médio        |
| `diasCobertura`    | 30     | Quantos dias a compra deve cobrir               |
| `prazoEntregaDias` | 7      | Tempo entre pedido e chegada                    |
| `diasSeguranca`    | 7      | Dias de consumo mantidos como segurança         |
| `todos`            | false  | `true` retorna o cálculo de todos os produtos   |

Fórmulas (modelo de ponto de pedido):

```text
consumoBase        = média diária  (ou a média recente, se a tendência for de ALTA)
estoqueSeguranca   = max(estoque mínimo cadastrado, consumoBase × diasSeguranca)
pontoPedido        = consumoBase × prazoEntrega + estoqueSeguranca
precisaRepor       = estoqueAtual ≤ pontoPedido
quantidadeSugerida = consumoBase × (diasCobertura + prazoEntrega) + estoqueSeguranca − estoqueAtual   (arredondada para cima)
diasRestantes      = estoqueAtual / consumoBase
```

A sugestão é arredondada para cima em unidades inteiras para `UN`, `CX`, `PCT` e `FD`. Para
`KG`, `G`, `L`, `ML` e `M`, preserva até três casas decimais.

Prioridade: **ALTA** se o produto zerou ou vai acabar antes de a reposição chegar; **MEDIA** se está abaixo
do estoque de segurança; **BAIXA** nos demais casos que precisam de reposição. A resposta também traz
`custoEstimado` (quantidade sugerida × preço) e é ordenada por prioridade.

A resposta inclui `totalConsumido`, `periodoAnaliseDias`, `diasCobertura`,
`prazoEntregaDias` e `diasSeguranca`, além de `consumoMedioDiario`,
`consumoBaseDiario`, `estoqueSeguranca` e `pontoPedido`. Assim o aplicativo
consegue explicar cada sugestão sem repetir parâmetros fixos no frontend.
Sem saídas na janela, a base de consumo é zero e uma eventual sugestão serve
apenas para atingir o estoque mínimo cadastrado; não é previsão de demanda.
O cálculo não mede automaticamente se o histórico é representativo.

Exemplo: saldo 80, consumo de 30 un. na primeira quinzena e 90 na segunda (tendência de ALTA, base 6/dia):
segurança = max(10, 42) = 42, ponto de pedido = 84, sugestão = 6 × 37 + 42 − 80 = **184 unidades**.

No caso de 400 UN consumidas apenas na quinzena recente e saldo de 100 UN,
a média de 30 dias é 13,333 UN/dia, mas a base pela tendência de ALTA é
26,667 UN/dia. Com os padrões (7 dias de entrega, 7 de segurança e 30 de
cobertura), o ponto é 373,338 UN e a necessidade de 1.073,348 UN é
arredondada para **1.074 UN**. Ao preço de R$ 25,90/UN, o custo estimado é
R$ 27.816,60. Essa projeção deve ser revista se a alta recente foi pontual.

## Dashboard

`GET /api/dashboard?diasVencimento=7` retorna em uma única chamada:

- `estoque`: total de produtos, com estoque baixo, zerados, valor total em estoque e total de fornecedores;
- `financeiro`: contas pendentes e vencidas, valor em aberto, valor vencido e contas que vencem nos próximos N dias;
- `sugestoesReposicao`: quantidade de produtos que precisam de reposição;
- `movimentacoesRecentes`: as 10 últimas;
- `contasProximasVencimento`: lista das contas que vencem nos próximos N dias;
- `consumoMensal`: séries dos últimos 6 meses separadas por unidade de medida. Cada item contém
  `unidadeMedida` e `pontos`; litros, quilos e unidades nunca são somados entre si.

## Formato de erro

Todos os erros, inclusive 401/403 do Spring Security, seguem o mesmo formato:

```json
{
  "timestamp": "2026-10-10T13:00:00-03:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Dados invalidos.",
  "path": "/api/produtos",
  "fields": { "nome": "Nome e obrigatorio." }
}
```

| Status | Quando                                                                 |
|--------|------------------------------------------------------------------------|
| 400    | Validação, JSON mal formado, parâmetro inválido                         |
| 401    | Sem token, token inválido/expirado, credenciais erradas                 |
| 404    | Recurso ou endpoint inexistente                                         |
| 409    | Duplicidade (e-mail, CNPJ), exclusão bloqueada por vínculo, edição concorrente |
| 422    | Regra de negócio (estoque insuficiente, produto inativo, conta já paga) |

## Testes automatizados

```powershell
.\mvnw.cmd test
```

A suíte atual possui 38 testes e usa H2 em memória no modo de compatibilidade PostgreSQL. Ela não
substitui uma validação separada contra PostgreSQL real.

## Testes manuais

Importe [`postman/InteliStock.postman_collection.json`](postman/InteliStock.postman_collection.json) no Postman.
A requisição de login salva o token automaticamente na variável `token`, e as de cadastro salvam os IDs criados.

## Decisões adotadas

Pendências de negócio do relatório inicial e como foram resolvidas (podem ser revistas pela equipe):

- **Exclusão de produto:** lógica, para preservar o histórico de movimentações.
- **Unidades de medida:** lista fixa (enum), para evitar variações como "kg"/"Kg"/"quilo".
- **Fornecedor no produto:** opcional. Na conta a pagar é obrigatório.
- **Parâmetros de reposição:** configuráveis por `application.properties` e por query params.
- **Status de contas:** PENDENTE, PAGA e CANCELADA gravados; VENCIDA calculado pela data.
- **Perfis de usuário:** não implementados. Todos os usuários autenticados têm o mesmo acesso.
