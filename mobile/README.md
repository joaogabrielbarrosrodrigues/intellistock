# IntelliStock Mobile

Aplicativo React Native + Expo + TypeScript para consumir a API do InteliStock.

## Como rodar

```powershell
cd mobile
npm install
npx expo start --clear
```

Na raiz do repositório, `.\rodar-projeto.ps1` inicia o back-end e o front-end juntos e tenta configurar automaticamente o IP da rede para o celular.

## Apresentar no iPhone e Android

O projeto usa **Expo SDK 58**, compatível com o Expo Go 58 exigido pelo aparelho. Instale ou atualize o Expo Go, conecte computador e celular à mesma rede Wi-Fi e inicie `.\rodar-projeto.ps1` na raiz. Leia o QR code mostrado pelo Expo. No iPhone, entre no Expo Go e no terminal com a mesma conta Expo.

Se o Expo já estava aberto antes de atualizar as dependências, encerre-o com `Ctrl+C` e inicie novamente com o cache limpo. Se o backend ainda estiver rodando, basta executar na pasta `mobile`:

```powershell
npx expo start --lan --clear
```

No momento do lançamento do SDK 58, a Expo informou que a versão correspondente do Expo Go chegaria às lojas nas semanas seguintes. Se o iPhone ainda mostrar Expo Go 54, use um build de desenvolvimento para testar o SDK 58 nele; a versão da App Store pode não acompanhar a do Android no mesmo dia.

Confirme que a linha `API para o celular:` mostra o IPv4 do computador. Se houver mais de uma placa de rede ou o IP detectado estiver errado, informe manualmente o endereço antes de iniciar:

```powershell
$env:EXPO_PUBLIC_API_URL="http://IP_DO_COMPUTADOR:8080"
.\rodar-projeto.ps1
```

Execute o comando acima na raiz do repositório. O valor padrão `http://localhost:8080` serve apenas para o computador; no celular, `localhost` aponta para o próprio aparelho. Se a conexão falhar, verifique se a porta 8080 do computador está acessível na rede e se o firewall permite a conexão. Para testar a API fora da rede local ou distribuir uma versão instalada, use uma URL HTTPS pública para `EXPO_PUBLIC_API_URL`.

Veja [o checklist de apresentação](../CHECKLIST_APRESENTACAO_MOBILE.md) antes de mostrar o app.

## Arquitetura

- `src/api`: cliente Axios, contratos tipados e mensagens de erro da API.
- `src/config`: configuracao de ambiente e timeout de rede.
- `src/storage`: sessao persistida com `expo-secure-store`.
- `src/contexts`: autenticacao, hidratacao da sessao e encerramento automatico em HTTP 401.
- `src/hooks`: queries React Query com cache, stale time e cancelamento de requisicoes.
- `src/components`: componentes visuais reutilizaveis e estados de carregamento/vazio/erro.
- `src/screens`: telas orientadas ao fluxo do produto.
- `src/notifications`: planejamento e agendamento local dos avisos de vencimento.
- `src/theme`: cores, espacamentos e tipografia centralizada.

## Tipografia

O aplicativo usa Montserrat nos títulos, indicadores e botões, e Inter nos textos de leitura,
formulários e navegação. As seis variações são carregadas pelo `expo-font`.

## Telas atuais

- Login com `POST /api/auth/login`.
- Dashboard com `GET /api/dashboard`.
- Produtos com `GET /api/produtos`.
- Estoque com `GET /api/estoque`.
- Contas com listagem, cadastro, edição, pagamento, cancelamento, reabertura e exclusão pelos endpoints reais.

O Dashboard apresenta o consumo mensal em gráficos separados por unidade de medida, evitando somar
litros, quilos, unidades e embalagens. Em Android/iOS, a sessão usa `expo-secure-store`; no Expo Web
de desenvolvimento, usa o armazenamento local do navegador como compatibilidade.

## Avisos de vencimento

Após o login, o app carrega as contas e pede permissão para notificações. Para cada conta em aberto, programa avisos locais **7 dias antes, 3 dias antes e no dia do vencimento, às 9h do horário do aparelho**. Contas pagas, canceladas ou excluídas deixam de ter avisos futuros; mudanças de data ou descrição atualizam os avisos. A sincronização também ocorre ao voltar ao app. A aba **Contas** mostra o estado da permissão e oferece **Testar avisos**, que envia uma notificação em cinco segundos.

Os avisos já programados podem aparecer com o app fechado. Contas criadas ou alteradas em outro aparelho só são sincronizadas quando este app se conecta e atualiza a lista; sem isso, não há envio por servidor. Avisos de horários já passados não são enviados retroativamente. O app programa os 60 próximos avisos para respeitar os limites de agendamento dos aparelhos e completa a fila nas próximas sincronizações. O horário exato pode sofrer pequeno atraso por economia de bateria do sistema.

## Validacao

```powershell
npm run typecheck
npm run test:reminders
npx expo install --check
npx expo-doctor
```
