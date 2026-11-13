# InteliStock — aplicativo

React Native + Expo SDK 58 + TypeScript, com o mesmo projeto para Android, iOS e web.
As dependências nativas seguem as versões indicadas pelo Expo.

## Executar

Recomendado: Node.js 24 LTS. A API precisa estar em execução.
Na raiz, `.\rodar-projeto.ps1` inicia API e Expo. Configure o IP do computador
em `mobile/.env` ou na variável de ambiente antes de iniciar o Expo.
Para iniciar somente o aplicativo:

```powershell
cd mobile
npm ci
$env:EXPO_PUBLIC_API_URL = "http://IP_DO_COMPUTADOR:8080"
npx expo start
```

Na web, pressione `w`. Para usar só no computador, a URL da API pode ser
`http://localhost:8080`, que também é o padrão quando a variável não é definida.
No celular, use o IP do computador e mantenha ambos na mesma rede.
Ao alterar `EXPO_PUBLIC_API_URL`, reinicie o Expo: ela é incorporada ao bundle.

Se o celular não conseguir acessar o projeto ou se o Expo estiver usando cache antigo,
use `npx expo start --lan --clear`.

Use Expo Go compatível com SDK 58 ou um build de desenvolvimento compatível.
A disponibilidade e a versão do Expo Go precisam ser conferidas no aparelho.
Se o projeto já estava aberto antes de atualizar dependências, encerre o Expo
e inicie novamente com `--clear`.

## Estrutura

| Diretório | Função |
| --- | --- |
| `src/api` | Axios, chamadas HTTP, contratos e mensagens de erro. |
| `src/config` | Endereço da API e timeout de 15 segundos. |
| `src/storage` | Persistência da sessão: SecureStore no celular e armazenamento local na web. |
| `src/contexts` | Login/logout, restauração de sessão e mensagens temporárias. |
| `src/hooks` | Consultas React Query, cache e invalidação após alterações. |
| `src/components` | Interface compartilhada e formulários. |
| `src/screens` | Login, dashboard, produtos, estoque, contas e menu Mais. |
| `src/navigation` | Login ou abas conforme a sessão. |
| `src/notifications` | Planejamento e agendamento local dos avisos de contas. |
| `src/theme` | Cores, espaçamentos e fontes Montserrat/Inter. |

Fornecedores e análise de consumo/reposição ficam no menu **Mais**.
O dashboard apresenta consumo separado por unidade de medida.
Os formulários validam os campos e bloqueiam reenvios simultâneos;
a API continua sendo a responsável por validar as regras e gravar os dados.

## Avisos de vencimento

Em Android/iOS, após o login o app consulta contas e solicita permissão para avisos
locais. Agenda os próximos 60 avisos, às 9h locais, em três momentos: 7 dias antes,
3 dias antes e no vencimento. A aba Contas mostra a permissão e oferece **Testar avisos**,
que agenda uma notificação para cinco segundos depois.
O aviso de teste consulta todas as contas e resume as vencidas, as que vencem hoje e as
que ainda vão vencer, independentemente do filtro selecionado na tela. Contas pagas e
canceladas não entram no resumo. Quando há muitas contas, são exibidos até dois nomes
por grupo e a quantidade das demais.

Contas pagas, canceladas ou excluídas deixam de ter avisos futuros na sincronização.
Alterações feitas em outro aparelho dependem de nova consulta neste aparelho.
Não há envio de push por servidor. A versão web não agenda essas notificações.
Os avisos já programados podem aparecer com o app fechado; o sistema do aparelho
pode atrasá-los por políticas de bateria. Confira o comportamento no dispositivo.

## Verificar

```powershell
npm run typecheck
npm test
npx expo install --check
npx expo-doctor
npx expo export --platform all --output-dir dist
```

`npm test` cobre lembretes, tratamento de 401, decimais e datas.
TypeScript também verifica imports e parâmetros sem uso.

O [guia do código](../docs/GUIA_DO_CODIGO.md) explica o fluxo completo. Use o
[checklist manual](../CHECKLIST_APRESENTACAO_MOBILE.md) para testar web e celular.
