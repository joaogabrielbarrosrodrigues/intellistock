# Checklist de testes e apresentação — InteliStock

Marque cada item separadamente no **iPhone** e no **Android**. Use uma base de demonstração isolada: os testes de cadastro, pagamento e movimentação alteram dados. Registre aparelho, versão do sistema, horário, resultado e uma captura de tela de cada falha.

## Preparação

- [ ] A API e o PostgreSQL iniciam sem erro. O computador e os dois celulares estão na mesma rede Wi-Fi.
- [ ] O `rodar-projeto.ps1` mostra `API para o celular: http://IP_DO_COMPUTADOR:8080`, com o IP correto. Pelo navegador do celular, um endpoint da API responde; uma resposta `401` em rota protegida já comprova acesso à rede.
- [ ] O Expo Go 58 abre o QR code nos aparelhos que têm essa versão. No iPhone, Expo CLI e Expo Go usam a mesma conta Expo; se o Expo Go disponível ainda for 54, use um build de desenvolvimento. O app abre sem tela vermelha ou erro de versão.
- [ ] O usuário e os dados de teste estão prontos. Anote previamente os totais esperados de produtos, alertas de estoque e contas.

## Fluxos essenciais em cada aparelho

- [ ] **Login:** credenciais corretas abrem a visão geral; senha incorreta mostra mensagem clara; ao fechar e reabrir o app, a sessão continua; sair retorna ao login.
- [ ] **Dashboard:** métricas de estoque e financeiro batem com as listas correspondentes; valores em reais, datas e unidades aparecem corretamente. Puxe para atualizar e confira os números após uma alteração.
- [ ] **Estoque:** filtros Todos/Baixo/Zerado mostram os itens certos. Registre uma entrada e uma saída; saldo, histórico e dashboard atualizam. Tente uma saída maior que o saldo: deve ser recusada sem mudar o estoque.
- [ ] **Produtos:** pesquise, cadastre e edite um produto. Confira validações de campos obrigatórios, preço e mínimo. Desative um produto de teste e confirme que saiu da lista ativa sem apagar o histórico.
- [ ] **Fornecedores:** cadastre e edite um fornecedor; confirme que aparece nos formulários de produto e conta. Tente excluir um fornecedor vinculado: a operação deve ser recusada com mensagem clara.
- [ ] **Contas:** cadastre, edite, pague, reabra e cancele contas de teste. Confira filtros, valor em aberto, vencidas e próximos vencimentos após cada ação. Teste data e valor inválidos.
- [ ] **Avisos de vencimento:** permita notificações quando o sistema pedir. Na aba Contas, toque em **Testar avisos** e confirme a notificação em cerca de cinco segundos, com o app aberto, em segundo plano e fechado.
- [ ] **Prazos dos avisos:** em uma base de teste, crie contas com vencimento em 8, 4 e 1 dia; na manhã seguinte, confirme respectivamente os avisos de 7 dias, 3 dias e do dia do vencimento. Pague ou cancele uma conta antes do aviso e confirme que o aviso futuro não aparece. Altere a data de outra conta e confirme que o aviso antigo não aparece.
- [ ] **Análise e reposição:** abra uma sugestão, confira estoque atual, quantidade sugerida, custo, prazo e aviso de histórico incompleto. Compare um item manualmente com o histórico de saídas; não trate a sugestão como pedido automático.

## Resposta do sistema e resistência a falhas

- [ ] Toque duas vezes rapidamente em Salvar e em Registrar saída. Deve ocorrer apenas uma gravação. Se houver timeout, **confira o histórico antes de tentar de novo**, pois ainda não há idempotência no servidor.
- [ ] Desligue o Wi-Fi durante uma atualização: aparece mensagem compreensível, sem travar. Reconecte e tente novamente; os dados voltam a carregar.
- [ ] Alterne entre abas rapidamente e volte ao app após deixá-lo em segundo plano. Não deve ocorrer tela em branco, perda inesperada de sessão ou conteúdo antigo permanente.
- [ ] Teste conta vazia e listas vazias: cada tela explica o que fazer, sem mostrar código, JSON, nomes de endpoint ou texto técnico.
- [ ] Use texto grande do sistema, teclado aberto e um aparelho de tela pequena. Botões, formulário, barra inferior e janelas de confirmação ficam visíveis; nada importante é cortado.
- [ ] Use VoiceOver no iPhone e TalkBack no Android: títulos, botões, valores do gráfico e mensagens de erro podem ser entendidos. Teste toque e rolagem com uma mão.

## Antes de apresentar

- [ ] Reinicie API e Expo e repita o caminho da apresentação: login → dashboard → produto → movimentação → reposição → conta. Cronometre o fluxo.
- [ ] Separe dados de demonstração previsíveis e faça uma cópia do banco. Deixe carregador, Wi-Fi e um segundo aparelho prontos.
- [ ] Confirme que os dois aparelhos conseguem abrir o mesmo projeto e consultar a API ao mesmo tempo.

## Melhorias pendentes, por prioridade

1. **Segurança da base:** definir se os usuários compartilham uma loja ou se há várias lojas. O cadastro é público e usuários autenticados consultam a mesma base; restringir cadastro e implementar autorização ou isolamento antes de expor dados reais.
2. **Movimentações seguras após falha de rede:** adicionar idempotência no servidor para evitar duplicação após timeout e reenvio.
3. **Distribuição fora da rede local:** hospedar a API com HTTPS e configurar a URL por ambiente. Preparar builds próprios de iOS e Android quando a apresentação deixar de usar Expo Go.
4. **Rastreabilidade financeira:** registrar quem pagou, reabriu ou cancelou uma conta e definir política para exclusão definitiva.
5. **Usabilidade:** navegação direta dos alertas da dashboard para listas filtradas, mensagens de validação por campo e entrada de datas/valores mais guiada.
6. **Escala:** paginar produtos, movimentações e contas; trocar listas extensas por listas virtualizadas.
7. **Qualidade da previsão:** indicar quando o histórico é curto, revisar sazonalidade e comparar sugestões com compras reais antes de automatizar decisões.

## Verificação automatizada nesta revisão

- `npm run typecheck`: passou.
- `npm run test:reminders`: 3 testes de datas, status e atualização de avisos passaram.
- `npx expo install --check`: dependências alinhadas ao SDK 58.
- `npx expo-doctor`: 20/20 verificações passaram.
- `EXPO_OFFLINE=1 npx expo export --platform ios` e `--platform android`: bundles gerados.
- `mvnw.cmd test`: 40 testes de backend passaram, usando H2 em memória no perfil de teste.

Esses comandos verificam código e empacotamento. O funcionamento físico no iPhone e no Android depende dos testes acima.
