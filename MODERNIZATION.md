# Auditoria e modernização do InteliStock

Relatório atualizado em 19/10/2026. O trabalho preservou a arquitetura em camadas, os dados existentes
e o escopo acadêmico. Nenhum comando destrutivo ou alteração automática de schema foi executado.

## Resultado geral

O fluxo principal está implementado: autenticação, fornecedores, produtos, movimentações, estoque,
contas a pagar, consumo, reposição e Dashboard. O mobile consome a API real e atualiza suas consultas
após operações de escrita.

As correções deste ciclo concentraram-se em confiabilidade do Dashboard, coerência matemática das
análises, ciclo completo de contas, persistência de sessão, mensagens de erro, segurança da configuração
local e legibilidade dos principais componentes.

## Diagnóstico por prioridade

| Prioridade | Diagnóstico | Resultado |
| --- | --- | --- |
| P0 | O Dashboard somava saídas de `UN`, `KG`, `L` e outras unidades em uma única série sem significado. | Corrigido. A API e o mobile agora exibem séries mensais separadas por unidade. |
| P0 | O contrato do gráfico esperava `periodo`, mas a API devolvia `inicio`/`fim`, causando tela branca após o login. | Corrigido e protegido por validação do contrato e error boundary. |
| P1 | `expo-secure-store` era chamado no Web, onde a implementação falhava. | Corrigido. Android/iOS continuam com SecureStore; Web de desenvolvimento usa armazenamento local. |
| P1 | Era possível trocar a unidade de um produto com histórico, reclassificando movimentações antigas. | Corrigido. A API retorna 422 quando já existem movimentações. |
| P1 | Reposição sempre arredondava para número inteiro, inclusive para medidas contínuas. | Corrigido. Itens contáveis usam inteiro; `KG`, `G`, `L`, `ML` e `M` preservam três casas. |
| P1 | O mobile não expunha cancelamento e reabertura de contas, embora a API já os oferecesse. | Corrigido, com confirmações para pagar, cancelar, reabrir e excluir. |
| P1 | Erros de renderização deixavam a aplicação inteiramente branca. | Corrigido com uma tela de recuperação global. |
| P1 | Credenciais locais estavam no script de inicialização. | Corrigido. O script lê `.env.local.ps1`, ignorado pelo Git. |
| P2 | Busca enviava uma requisição a cada tecla. | Corrigido em produtos e fornecedores com debounce de 300 ms. |
| P2 | Listagens de produtos e contas podiam fazer consultas adicionais por fornecedor. | Corrigido com `EntityGraph`. |
| P2 | Datas locais e quantidades com três casas podiam ser apresentadas incorretamente. | Corrigido na formatação e validação do mobile. |

## Contratos corrigidos

### Dashboard

`GET /api/dashboard` mantém o mesmo endpoint, mas `consumoMensal` agora é uma coleção de séries:

```json
{
  "consumoMensal": [
    {
      "unidadeMedida": "KG",
      "pontos": [
        { "inicio": "2026-10-01", "fim": "2026-10-19", "quantidade": 12.5 }
      ]
    }
  ]
}
```

Essa mudança é deliberada e evita uma soma matematicamente inválida.

### Série de consumo

`GET /api/analises/consumo/serie` exige exatamente um filtro:

- `produtoId=<uuid>` para a série de um produto; ou
- `unidadeMedida=UN|KG|G|L|ML|M|CX|PCT|FD` para consolidar apenas unidades compatíveis.

Sem filtro, ou com os dois filtros ao mesmo tempo, a API retorna 422.

## Arquitetura e manutenção

- O mobile mantém apresentação em `screens`, componentes compartilhados em `components`, acesso HTTP
  em `api`, estado remoto em `hooks`, sessão em `contexts/storage` e tokens em `theme`.
- Dashboard, produtos, contas e formulário de contas foram descompactados para facilitar manutenção.
- Erros HTTP continuam centralizados e as mutações invalidam todas as consultas relacionadas.
- Botões de escrita ficam indisponíveis enquanto a operação está em andamento.
- A largura do conteúdo foi limitada em telas grandes sem prejudicar o layout nativo.
- Não foram adicionadas dependências.

## Segurança e modelo de dados

- Senhas permanecem protegidas por BCrypt e a API usa JWT assinado com segredo mínimo de 32 bytes.
- CORS não possui mais fallback implícito para `*`; as origens vêm da configuração obrigatória.
- O perfil padrão usa `ddl-auto=validate`; somente o perfil local `dev` usa `update`.
- `.env.local.ps1` contém apenas configuração local e é ignorado pelo Git.
- O sistema atual representa **uma operação compartilhada**: qualquer usuário autenticado acessa os mesmos
  produtos, fornecedores, contas e indicadores. Não há organização/tenant nas entidades. Multi-tenancy
  não foi implementado porque essa decisão de negócio ainda não foi confirmada.

## Validação executada

### Back-end

Comando executado:

```powershell
cd intellistock-backend
.\mvnw.cmd test
```

Resultado: **38 testes aprovados, 0 falhas e 0 erros**. A suíte cobre autenticação, validações,
fornecedores, produtos, regras de estoque, histórico, contas, consumo, reposição,
unidades incompatíveis, arredondamento e erros HTTP.

Os testes usam H2 em memória no modo de compatibilidade PostgreSQL e MockMvc. Eles não equivalem a um
teste de integração contra PostgreSQL real.

### Mobile

Comandos executados:

```powershell
cd mobile
npm run typecheck
npx expo export --platform web --output-dir dist
```

Resultado: TypeScript aprovado e bundle Web gerado com sucesso. Não existe ainda uma suíte automatizada
de componentes/hooks no projeto; nenhuma aprovação de teste mobile foi inferida além dessas verificações.

## Não validado neste ambiente

- Fluxo manual completo em aparelho ou emulador Android.
- Compatibilidade visual em diferentes densidades e tamanhos físicos.
- Integração contra uma instância PostgreSQL real.
- Concorrência real com múltiplos processos/instâncias da API.
- Estratégia de isolamento por empresa/organização.
- Cadastro de usuário dentro do mobile; o endpoint existe, mas a interface atual oferece apenas login.

## Checklist manual Android

- [ ] Iniciar PostgreSQL, back-end e Expo; confirmar que não há erro nos terminais.
- [ ] Autenticar um usuário e confirmar a restauração da sessão ao reabrir o app.
- [ ] Cadastrar um fornecedor e encontrá-lo pela busca.
- [ ] Cadastrar um produto com unidade, preço, estoque mínimo e fornecedor.
- [ ] Registrar uma entrada e confirmar saldo e histórico.
- [ ] Registrar uma saída válida e conferir Dashboard, estoque e histórico.
- [ ] Tentar uma saída superior ao saldo e confirmar a mensagem de estoque insuficiente.
- [ ] Criar produtos em unidades diferentes e confirmar gráficos separados no Dashboard.
- [ ] Validar consumo, tendência e quantidade sugerida de reposição.
- [ ] Cadastrar uma conta, editar, pagar e conferir os indicadores financeiros.
- [ ] Cancelar e reabrir uma conta, conferindo filtros e Dashboard.
- [ ] Confirmar diálogos antes de desativar produto, excluir fornecedor ou excluir conta.
- [ ] Desligar o back-end temporariamente e validar mensagem de rede e ação “Tentar novamente”.

## Recomendações futuras

### P1

- Definir formalmente se os dados são compartilhados ou separados por organização antes de ampliar o uso.
- Criar testes de integração com PostgreSQL real, preferencialmente em ambiente isolado.
- Adicionar testes mobile para autenticação, formulários, erros e invalidação de consultas.
- Fazer a validação ponta a ponta no Android antes da apresentação.

### P2

- Adotar paginação na API e `FlatList` quando o volume real justificar; as listas atuais carregam tudo.
- Substituir o campo textual de vencimento por seletor nativo de data após validar a biblioteca adequada.
- Considerar rate limiting no login se a API for exposta publicamente.
- Adotar Flyway somente após backup, baseline do schema atual e plano de reversão.

## Como executar

Na raiz do projeto, depois de preencher `.env.local.ps1`:

```powershell
.\rodar-projeto.ps1
```

O script abre o back-end em outra janela e inicia o Expo no terminal atual. Para dispositivo físico,
defina `EXPO_PUBLIC_API_URL` com o IP LAN da máquina antes de iniciar o Expo.
