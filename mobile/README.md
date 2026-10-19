# InteliStock Mobile

Aplicativo React Native + Expo + TypeScript para consumir a API do InteliStock.

## Como rodar

```powershell
cd mobile
npm install
npm start
```

Na raiz do repositório, `\.\rodar-projeto.ps1` inicia o back-end e o front-end juntos.

Por padrao, o app usa `http://localhost:8080`. Para testar em um celular fisico, aponte para o IP da maquina onde o backend esta rodando:

```powershell
$env:EXPO_PUBLIC_API_URL="http://SEU_IP:8080"
npm start
```

## Arquitetura

- `src/api`: cliente Axios, contratos tipados e mensagens de erro da API.
- `src/config`: configuracao de ambiente e timeout de rede.
- `src/storage`: sessao persistida com `expo-secure-store`.
- `src/contexts`: autenticacao, hidratacao da sessao e encerramento automatico em HTTP 401.
- `src/hooks`: queries React Query com cache, stale time e cancelamento de requisicoes.
- `src/components`: componentes visuais reutilizaveis e estados de carregamento/vazio/erro.
- `src/screens`: telas orientadas ao fluxo do produto.

## Telas atuais

- Login com `POST /api/auth/login`.
- Dashboard com `GET /api/dashboard`.
- Produtos com `GET /api/produtos`.
- Estoque com `GET /api/estoque`.
- Contas com listagem, cadastro, edição, pagamento, cancelamento, reabertura e exclusão pelos endpoints reais.

O Dashboard apresenta o consumo mensal em gráficos separados por unidade de medida, evitando somar
litros, quilos, unidades e embalagens. Em Android/iOS, a sessão usa `expo-secure-store`; no Expo Web
de desenvolvimento, usa o armazenamento local do navegador como compatibilidade.

## Validacao

```powershell
npm run typecheck
```
