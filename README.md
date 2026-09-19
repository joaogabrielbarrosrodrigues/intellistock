InteliStock

Sistema mobile de gerenciamento de estoque e apoio ao planejamento de
compras.

Projeto acadêmico --- desenvolvimento mobile com integração completa
entre Front-end, Back-end e Banco de Dados.

Sobre o projeto

O InteliStock é um sistema de gerenciamento de estoque desenvolvido
para auxiliar empresas no controle de seus produtos e no planejamento de
compras.

O sistema permitirá o cadastro e acompanhamento dos itens em estoque,
realizando a atualização das quantidades conforme ocorrerem entradas e
saídas.

A partir do histórico de movimentações, o sistema calculará a média de
consumo dos produtos em diferentes períodos, como diário, semanal e
mensal. Com base nesses dados, o InteliStock poderá identificar
tendências de consumo e gerar sugestões de reposição, auxiliando o
usuário no planejamento e reduzindo os riscos de falta ou excesso de
produtos.

Além do controle de estoque, o sistema contará com um módulo de contas
a pagar, permitindo o cadastro e acompanhamento de
boletos/compromissos financeiros, incluindo informações como fornecedor,
valor e data de vencimento.

O objetivo é centralizar informações relacionadas ao estoque e às
obrigações financeiras em uma única plataforma, disponibilizando dados e
indicadores que auxiliem na organização e na tomada de decisões.

Objetivos

Objetivo geral

Desenvolver uma aplicação mobile para gerenciamento de estoque,
acompanhamento de movimentações, análise de consumo, sugestão de
reposição e controle de contas a pagar.

Objetivos específicos

Cadastrar e consultar produtos;

Acompanhar as quantidades disponíveis em estoque;

Registrar entradas de produtos;

Registrar saídas de produtos;

Atualizar automaticamente o estoque após as movimentações;

Manter histórico das movimentações;

Calcular médias de consumo diário, semanal e mensal;

Identificar tendências de consumo;

Gerar sugestões de reposição;

Cadastrar fornecedores;

Registrar contas e boletos a pagar;

Acompanhar valores e datas de vencimento;

Disponibilizar indicadores para auxiliar o planejamento da empresa;

Integrar o aplicativo mobile a uma API própria;

Persistir os dados em banco de dados relacional.

Aplicativo Mobile

O aplicativo será desenvolvido utilizando React Native, com
TypeScript como linguagem.

O Mobile será responsável pela interface com o usuário e pela
comunicação com o Back-end através de requisições HTTP.

Principais módulos planejados

Login e autenticação;

Dashboard;

Produtos;

Estoque;

Movimentações;

Análise de consumo;

Sugestões de reposição;

Fornecedores;

Contas a pagar;

Indicadores e relatórios.

Fluxo simplificado

Usuário
   ↓
Aplicativo React Native
   ↓
API REST
   ↓
Back-end Spring Boot
   ↓
PostgreSQL

Back-end

O Back-end será desenvolvido em Java com Spring Boot.

Ele será responsável por:

Disponibilizar a API REST;

Receber e validar as requisições do aplicativo;

Executar as regras de negócio;

Realizar autenticação e autorização;

Processar movimentações de estoque;

Calcular indicadores de consumo;

Gerar sugestões de reposição;

Gerenciar contas a pagar;

Comunicar-se com o banco de dados.

Arquitetura do Back-end

Será utilizada uma organização em camadas:

Controller
    ↓
Service
    ↓
Repository
    ↓
Database

Controller

Recebe as requisições HTTP e encaminha os dados para a camada de
serviço.

Service

Concentra as regras de negócio do sistema.

Exemplo:

Registrar saída
      ↓
Verificar produto
      ↓
Verificar quantidade disponível
      ↓
Registrar movimentação
      ↓
Atualizar estoque
      ↓
Retornar resultado

Repository

Responsável pelo acesso aos dados através do Spring Data JPA.

Entity

Representa as principais entidades persistidas no banco de dados.

DTO

Será utilizado para controlar os dados enviados e recebidos pela API,
evitando expor diretamente as entidades do banco em todas as operações.

Banco de Dados

O banco de dados escolhido será o PostgreSQL.

A persistência será realizada pelo Back-end Java utilizando:

Spring Data JPA;

Hibernate;

PostgreSQL.

Entidades principais previstas

Usuário

Responsável pelo acesso ao sistema.

Campos previstos:

id
nome
email
senha
created_at

Produto

Representa os itens controlados pelo estoque.

Campos previstos:

id
nome
descricao
quantidade
estoque_minimo
unidade_medida
preco
fornecedor_id
created_at

Movimentação

Registra as entradas e saídas de produtos.

Campos previstos:

id
produto_id
tipo
quantidade
data
observacao
usuario_id

Tipos de movimentação:

ENTRADA
SAIDA

Fornecedor

Representa os fornecedores relacionados aos produtos e às contas.

Campos previstos:

id
nome
cnpj
telefone
email

Conta a pagar

Representa os compromissos financeiros cadastrados no sistema.

Campos previstos:

id
fornecedor_id
descricao
valor
data_vencimento
status

A modelagem definitiva do banco será validada antes da implementação
para evitar alterações desnecessárias durante o desenvolvimento.

Inteligência de estoque

Uma das funcionalidades centrais do InteliStock será utilizar o
histórico de movimentações para produzir indicadores de consumo e
auxiliar no planejamento de reposição.

Consumo médio diário

Exemplo conceitual:

Consumo médio diário =
Quantidade consumida / Número de dias

Exemplo:

Consumo em 30 dias: 300 unidades

300 / 30 = 10 unidades por dia

Consumo semanal e mensal

O sistema também poderá consolidar as movimentações para apresentar o
consumo em diferentes períodos.

Diário
   ↓
Semanal
   ↓
Mensal

Estoque mínimo

Uma regra de negócio poderá utilizar o consumo médio e uma margem de
segurança para determinar um nível mínimo de estoque.

Exemplo conceitual:

Estoque mínimo =
Consumo médio diário × Dias de segurança

Sugestão de reposição

Quando o estoque estiver abaixo do nível definido, o sistema poderá
apresentar uma sugestão de reposição.

Exemplo:

Produto: Leite

Estoque atual: 32
Estoque mínimo: 50

→ Estoque abaixo do mínimo
→ Gerar alerta de reposição

A fórmula definitiva para a quantidade sugerida será definida durante a
etapa de regras de negócio.

Segurança

O sistema terá autenticação de usuários.

A arquitetura prevista utilizará:

Spring Security;

JWT (JSON Web Token);

Senhas armazenadas utilizando hash seguro;

Controle de acesso aos endpoints protegidos.

Fluxo:

Login
  ↓
Spring Security
  ↓
Validação das credenciais
  ↓
JWT
  ↓
Aplicativo armazena o token
  ↓
Token enviado nas próximas requisições

API REST

A comunicação entre o aplicativo e o Back-end será realizada através de
uma API REST utilizando JSON.

Endpoints planejados

Autenticação

POST /api/auth/login
POST /api/auth/register

Produtos

GET    /api/produtos
GET    /api/produtos/{id}
POST   /api/produtos
PUT    /api/produtos/{id}
DELETE /api/produtos/{id}

Movimentações

GET  /api/movimentacoes
POST /api/movimentacoes

Estoque

GET /api/estoque
GET /api/estoque/baixo
GET /api/estoque/{produtoId}

Análises

GET /api/analises/consumo
GET /api/analises/reposicao

Fornecedores

GET    /api/fornecedores
GET    /api/fornecedores/{id}
POST   /api/fornecedores
PUT    /api/fornecedores/{id}
DELETE /api/fornecedores/{id}

Contas a pagar

GET    /api/contas
GET    /api/contas/{id}
POST   /api/contas
PUT    /api/contas/{id}
DELETE /api/contas/{id}

Os endpoints acima representam o planejamento inicial da API. Os
contratos definitivos serão definidos durante a implementação do
Back-end.

🏗️ Arquitetura geral

┌───────────────────────────────────────────────┐
│                  MOBILE                       │
│                                               │
│        React Native + TypeScript              │
│                                               │
│  Login • Dashboard • Estoque • Contas        │
└───────────────────────┬───────────────────────┘
                        │
                     HTTP/JSON
                        │
                        ▼
┌───────────────────────────────────────────────┐
│                  BACK-END                     │
│                                               │
│              Java + Spring Boot               │
│                                               │
│ Controller → Service → Repository             │
│                                               │
│ Spring Security + JWT                         │
│ Spring Data JPA + Hibernate                   │
└───────────────────────┬───────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────┐
│                 DATABASE                      │
│                                               │
│                  PostgreSQL                   │
└───────────────────────────────────────────────┘

Tecnologias

Front-end Mobile

Tecnologia         Utilização

React Native       Desenvolvimento do aplicativo mobile
TypeScript         Linguagem de programação
Axios              Comunicação HTTP com a API
React Navigation   Navegação entre telas

Back-end

Tecnologia        Utilização

Java              Linguagem do Back-end
Spring Boot       Desenvolvimento da API
Spring Web        Criação dos endpoints REST
Spring Data JPA   Persistência e acesso aos dados
Hibernate         ORM
Spring Security   Autenticação e autorização
JWT               Autenticação baseada em token
Maven             Gerenciamento do projeto e dependências

Banco de dados

Tecnologia   Utilização

PostgreSQL   Banco de dados relacional

Desenvolvimento e testes

Ferramenta           Utilização

Visual Studio Code   Desenvolvimento do Mobile
IntelliJ IDEA        Desenvolvimento do Back-end Java
Git                  Controle de versão
GitHub               Hospedagem do código e colaboração
GitHub Desktop       Gerenciamento do repositório
Postman              Testes da API

Estrutura planejada do repositório

InteliStock/
│
├── docs/
│   └── InteliStock.pdf
│
├── mobile/
│   ├── src/
│   │   ├── components/
│   │   ├── screens/
│   │   ├── navigation/
│   │   ├── services/
│   │   ├── models/
│   │   ├── hooks/
│   │   └── utils/
│   │
│   └── App.tsx
│
├── backend/
│   ├── src/
│   │   ├── controller/
│   │   ├── service/
│   │   ├── repository/
│   │   ├── entity/
│   │   ├── dto/
│   │   ├── security/
│   │   └── config/
│   │
│   └── pom.xml
│
├── database/
│
└── README.md

Fluxo de uma operação

Exemplo: registro de saída de um produto.

1. Usuário acessa o aplicativo
          ↓
2. Seleciona um produto
          ↓
3. Informa a quantidade da saída
          ↓
4. React Native envia POST /api/movimentacoes
          ↓
5. Spring Boot recebe a requisição
          ↓
6. Controller encaminha para o Service
          ↓
7. Service valida as regras de negócio
          ↓
8. Movimentação é registrada
          ↓
9. Quantidade do estoque é atualizada
          ↓
10. PostgreSQL persiste os dados
          ↓
11. API retorna resposta JSON
          ↓
12. React Native atualiza a interface

📊 Dashboard

O Dashboard deverá centralizar os principais indicadores do sistema.

Indicadores planejados:

Quantidade de produtos cadastrados;

Produtos com estoque baixo;

Consumo por período;

Movimentações recentes;

Contas próximas do vencimento;

Indicadores relacionados à reposição.

Exemplo conceitual:

┌──────────────────────────────────┐
│          INTELISTOCK             │
├──────────────────────────────────┤
│ Produtos              128        │
│ Estoque baixo           8        │
│ Contas próximas         5        │
├──────────────────────────────────┤
│       CONSUMO MENSAL             │
│             📈                   │
├──────────────────────────────────┤
│ Produtos | Estoque | Contas      │
└──────────────────────────────────┘

Escopo inicial

De acordo com a definição inicial do projeto, o InteliStock está focado
em gerenciamento de estoque, análise de consumo, reposição e contas a
pagar.

Funcionalidades que não fazem parte da primeira versão deverão ser
mantidas fora do escopo até que sejam formalmente incluídas no
planejamento.

Plano de desenvolvimento

Fase 1 --- Planejamento

Definição dos requisitos;

Definição da arquitetura;

Modelagem do banco;

Definição da API;

Organização do GitHub.

Fase 2 --- Back-end

Criação do projeto Spring Boot;

Configuração do PostgreSQL;

Configuração do JPA/Hibernate;

Criação das entidades;

Criação dos repositories;

Criação dos services;

Criação dos controllers.

Fase 3 --- Segurança

Cadastro;

Login;

Spring Security;

JWT;

Proteção dos endpoints.

Fase 4 --- Estoque

Cadastro de produtos;

Entradas;

Saídas;

Histórico;

Atualização automática do estoque.

Fase 5 --- Análises

Consumo diário;

Consumo semanal;

Consumo mensal;

Estoque mínimo;

Tendências;

Sugestões de reposição.

Fase 6 --- Contas a pagar

Cadastro de fornecedores;

Cadastro de contas;

Valores;

Datas de vencimento;

Status dos pagamentos.

Fase 7 --- Mobile

Estrutura do React Native;

Navegação;

Telas;

Consumo da API;

Autenticação;

Dashboard;

Módulos de estoque e financeiro.

Fase 8 --- Testes e integração

Testes da API;

Testes das regras de negócio;

Testes de integração;

Testes do aplicativo;

Correção de erros.

Fase 9 --- Finalização

Documentação;

Organização do código;

Deploy;

Preparação da apresentação;

Demonstração do sistema.

Estratégia de Git

O desenvolvimento será realizado utilizando Git e GitHub.

A branch principal será:

main

Durante o desenvolvimento, recomenda-se trabalhar com branches de
funcionalidades:

main
│
├── feature/backend
├── feature/mobile
├── feature/database
├── feature/auth
├── feature/produtos
├── feature/estoque
└── feature/contas

Exemplos de commits:

docs: adiciona documentação inicial
feat: cria estrutura do backend
feat: configura conexão com PostgreSQL
feat: implementa entidade Produto
feat: implementa cadastro de produtos
feat: implementa movimentação de estoque
feat: adiciona autenticação JWT

Equipe

Projeto desenvolvido por:

Beatriz Salles Pereira

Caio Roberto de Almeida Silva

Guilherme Paiva de Jesus

João Gabriel Barros Rodrigues

Rafaely Cristina Campos Reis
