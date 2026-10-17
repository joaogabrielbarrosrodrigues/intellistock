# Modernização do InteliStock

Este ciclo preserva a arquitetura em camadas e os contratos HTTP já existentes. A entrega prioriza o aplicativo mobile e remove riscos de configuração sem executar qualquer alteração no banco de dados.

## Diagnóstico e prioridades

| Prioridade | Situação encontrada | Tratamento neste ciclo |
| --- | --- | --- |
| P0 | Senha do banco e chave JWT tinham valores padrão versionados; CORS aceitava qualquer origem. | Removidos os valores padrão. A aplicação agora exige `DB_USERNAME`, `DB_PASSWORD` e `JWT_SECRET`; o segredo é validado com no mínimo 32 bytes. CORS local é restrito a origens de desenvolvimento configuráveis. |
| P1 | O mobile só consumia listas, apesar de a API oferecer cadastros, alterações, pagamento e movimentação. | Contratos tipados, mutações React Query e fluxos de cadastro/edição foram conectados aos endpoints reais. |
| P1 | Atualização automática de esquema poderia ser ativada em qualquer ambiente. | O padrão é `validate`; `ddl-auto=update` ficou restrito ao perfil explícito `dev`. |
| P2 | Interface com cards/bordas inconsistentes e pouca visibilidade operacional. | Criado um design system leve e redesenhadas as telas de login, dashboard, produtos, estoque, contas e mais. |
| P3 | Não há migrações versionadas nem validação contra PostgreSQL real. | Mantido sem alteração destrutiva; plano de evolução abaixo. |

## Configuração segura do backend

Use [`application.example.properties`](intellistock-backend/src/main/resources/application.example.properties) como referência, mas defina os valores no ambiente do processo. O projeto não carrega `.env` automaticamente.

No PowerShell, para desenvolvimento local:

```powershell
$env:DB_USERNAME = "postgres"
$env:DB_PASSWORD = "sua-senha-local"
$env:JWT_SECRET = "um-segredo-aleatorio-com-no-minimo-32-bytes"
$env:SPRING_PROFILES_ACTIVE = "dev"
cd intellistock-backend
.\mvnw.cmd spring-boot:run
```

O perfil `dev` permite que Hibernate atualize apenas o banco local. Sem esse perfil, a aplicação usa `ddl-auto=validate`, adequado para ambientes compartilhados e produção. Arquivos locais e credenciais estão ignorados pelo Git.

### Próxima etapa segura para o banco

Antes de adotar Flyway, faça backup e gere uma migração de baseline a partir do schema PostgreSQL atual. Em homologação, aplique primeiro a baseline sem DDL destrutivo, altere para `ddl-auto=validate` e compare o schema. Só então passe novas alterações a migrações versionadas. Esta etapa não foi automatizada porque pode afetar bases existentes.

## Aplicativo mobile

O endereço da API é configurado por `EXPO_PUBLIC_API_URL`. Em dispositivo físico, use o IP LAN da máquina, por exemplo:

```powershell
$env:EXPO_PUBLIC_API_URL = "http://192.168.1.20:8080"
cd mobile
npm start
```

O aplicativo nativo não depende de CORS; a configuração de origem é relevante para o Expo Web.

### Fluxos entregues

- Login com validação, carregamento e armazenamento seguro da sessão já existente.
- Dashboard com KPIs, consumo mensal baseado na API, movimentações e vencimentos reais.
- Produtos: busca, cadastro, edição e desativação com confirmação.
- Estoque: filtros, entradas e saídas por produto, feedback de regra de estoque insuficiente e histórico real.
- Contas: filtro por status, cadastro, edição, pagamento e exclusão confirmada.
- Área “Mais”: fornecedores com cadastro/edição/exclusão e painel de consumo/reposição calculado no backend.
- Todas as operações de escrita invalidam as consultas relacionadas no React Query para atualizar a tela sem dados fictícios.

## Validação executada

- `mobile`: `npm run typecheck` — aprovado.
- `intellistock-backend`: `.\mvnw.cmd test` — aprovado, 35 testes. Eles usam H2 em modo de compatibilidade PostgreSQL e MockMvc; não substituem uma suíte de integração com PostgreSQL real.
