# InteliStock

Projeto acadêmico de gerenciamento de estoque e contas a pagar, com aplicativo
React Native/Expo para Android, iOS e web, API Java/Spring Boot e PostgreSQL.

O sistema implementa login, fornecedores, produtos, entradas e saídas, dashboard,
análise de consumo, sugestões de reposição e controle de contas. As sugestões usam
fórmulas sobre o histórico de saídas e precisam ser avaliadas pelo usuário.

## Executar no Windows

Pré-requisitos: **Java 21**, **Node.js 24 LTS** com npm e **PostgreSQL** iniciado.
O Maven é executado pelo wrapper incluído no repositório.

1. Crie um banco PostgreSQL chamado `intellistock` (ou ajuste `DB_URL`).
2. Copie `.env.example.ps1` para `.env.local.ps1` e informe usuário, senha do banco,
   um segredo JWT de pelo menos 32 bytes e o código de cadastro escolhido por vocês.
   Se o arquivo local já existir, acrescente a linha abaixo sem apagar as outras configurações.
   O arquivo local é ignorado pelo Git. Por exemplo:

   ```powershell
   $env:CODIGO_CADASTRO = 'escolha-um-codigo-privado'
   ```

   Compartilhe o código apenas com quem pode criar uma conta. Ele deve ser digitado
   exatamente como configurado, incluindo letras maiúsculas e minúsculas. Para alterá-lo,
   edite o arquivo e reinicie a API; contas já criadas continuam funcionando. A API não
   inicia se o código não estiver definido, estiver em branco ou ultrapassar 128 caracteres.
3. Na raiz do projeto, execute:

```powershell
.\rodar-projeto.ps1
```

O script instala as dependências se necessário, inicia a API em segundo plano,
aguarda sua resposta e abre o Expo no terminal. Os logs da API ficam em `.logs/`.
Mantenha esse terminal aberto; `Ctrl+C` encerra o Expo e o backend iniciado pelo script.
A porta 8080 precisa estar disponível antes de iniciar.

- **Web:** pressione `w` no terminal do Expo; o endereço padrão é `http://localhost:8081`.
- **Celular:** conecte computador e aparelho à mesma rede Wi-Fi e leia o QR code em
  um Expo Go compatível com o SDK 58. Um build de desenvolvimento também pode ser usado.
- **API:** `http://localhost:8080` no computador. Para usar no celular, coloque o IPv4
  atual do computador no arquivo `mobile/.env` antes de iniciar o Expo:

```ini
EXPO_PUBLIC_API_URL=http://IP_DO_COMPUTADOR:8080
```

No Windows, use `ipconfig` para encontrar o IPv4 da rede conectada. Ao trocar de rede,
confira o endereço, atualize o arquivo se necessário e reinicie o Expo. Outra opção é
definir a variável no terminal antes de executar o script:

```powershell
$env:EXPO_PUBLIC_API_URL = "http://IP_DO_COMPUTADOR:8080"
.\rodar-projeto.ps1
```

Uma variável já definida no terminal pode prevalecer sobre o arquivo `.env`.
No celular, `localhost` aponta para o próprio aparelho. Se a API não responder,
confira o IP e o acesso à porta 8080 na rede. Para acessar a versão web por outro
endereço, inclua sua origem em `CORS_ALLOWED_ORIGINS` na configuração local.

O perfil local `dev` usa atualização automática do schema pelo Hibernate.
O perfil padrão usa validação do schema. As configurações estão explicadas no
[README da API](intellistock-backend/README.md).

Para iniciar manualmente, em dois terminais:

```powershell
# Terminal do back-end
. .\.env.local.ps1
cd intellistock-backend
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev"

# Terminal do front-end
cd mobile
npx expo start
```

No front-end, pressione `w` para abrir a web ou leia o QR code no Expo Go.
Para o celular, defina `EXPO_PUBLIC_API_URL` com o IP do computador antes de executar o Expo.

## Cadastro de usuários

Na tela de login, selecione **Criar conta**, preencha seus dados e informe o código de
cadastro configurado na API. Depois, entre com seu e-mail e sua senha. O código é
compartilhado para liberar novos cadastros; a senha de cada usuário é individual.

## Organização e explicação do código

```text
mobile/                 aplicativo Expo/React Native + TypeScript
  src/screens/          telas
  src/components/       formulários e componentes visuais
  src/hooks/            consultas e mutações com React Query
  src/api/              cliente HTTP e contratos
  src/contexts/         sessão e mensagens
  src/notifications/    avisos locais de vencimento
intellistock-backend/    API Java 21 + Spring Boot
  src/main/java/.../    controllers, services, repositories, DTOs e entidades
  src/test/             testes com H2 isolado
docs/                   guia de leitura e revisão atual
```

O caminho principal é **tela → hook → Axios → controller → service → repository → banco**.
Leia o [guia do código](docs/GUIA_DO_CODIGO.md) para entender autenticação, transações,
atualização das telas e fórmulas de reposição com exemplos.

## Verificações automatizadas

Na pasta `mobile`:

```powershell
npm ci
npm run typecheck
npm test
npx expo install --check
npx expo-doctor
npx expo export --platform all --output-dir dist
```

Na pasta `intellistock-backend`:

```powershell
.\mvnw.cmd test
```

Os testes Java usam **H2 em memória**, sem alterar o PostgreSQL local. Gerar os bundles
nativos verifica empacotamento; execução, teclado, layout e notificações precisam ser
conferidos no aparelho. Os avisos locais de contas não funcionam na versão web.

Veja os [resultados e limites desta revisão](docs/REVISAO_2026-11-06.md), o
[checklist web/celular](CHECKLIST_APRESENTACAO_MOBILE.md) e as
[instruções do aplicativo](mobile/README.md).

## Escopo atual

Todos os usuários autenticados compartilham a mesma base e têm as mesmas permissões.
Cada instalação representa uma empresa; para separar empresas, use APIs e bancos
independentes. O código de cadastro compartilhado não bloqueia contas já criadas e
não substitui uma gestão de usuários.
Movimentações não possuem chave de idempotência: após um timeout, consulte o histórico
antes de reenviar. Os resultados atuais estão na documentação vinculada acima.
