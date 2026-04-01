# Mercagro

Plataforma de **aluguel e leilão de máquinas agrícolas** peer-to-peer, com recomendações por IA e painel administrativo completo. Desenvolvida como Trabalho de Conclusão de Curso (TCC).

---

## Sumário

- [Visão Geral](#visão-geral)
- [Arquitetura do Sistema](#arquitetura-do-sistema)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Funcionalidades](#funcionalidades)
- [Estrutura de Diretórios](#estrutura-de-diretórios)
- [Banco de Dados](#banco-de-dados)
- [Pré-requisitos](#pré-requisitos)
- [Configuração e Instalação](#configuração-e-instalação)
- [Rodando o Projeto](#rodando-o-projeto)
- [Scripts Utilitários](#scripts-utilitários)
- [Rotas da API](#rotas-da-api)
- [Páginas do Frontend](#páginas-do-frontend)

---

## Visão Geral

O Mercagro conecta **produtores rurais** (que precisam de equipamentos) com **proprietários de máquinas** (que desejam alugar ou leiloar seus ativos). A plataforma oferece:

- Marketplace de aluguel com filtro por localização e categoria
- Leilões em tempo real com lances automáticos via Supabase Realtime
- Recomendações de equipamentos com GPT-4o baseadas na cultura, solo e área
- Sugestão de preço de diária para proprietários via IA
- Painel admin para aprovação de equipamentos, bloqueio de usuários e contabilidade
- Taxa de plataforma de 1% sobre cada locação

---

## Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTE (Browser)                     │
│                                                             │
│   React 18 + Vite  ──  React Router v6  ──  Supabase JS    │
│         :5173                                               │
└──────────────────────────┬──────────────────────────────────┘
                           │  HTTP (REST) / Supabase Realtime
           ┌───────────────┴───────────────┐
           │                               │
           ▼                               ▼
┌──────────────────┐             ┌──────────────────────┐
│  Backend Express │             │   Supabase (BaaS)    │
│    :3001         │             │                      │
│                  │◄────────────►  PostgreSQL (DB)     │
│  /api/equipment  │             │  Auth (JWT)          │
│  /api/rentals    │             │  Storage (fotos)     │
│  /api/auctions   │             │  Realtime (lances)   │
│  /api/auth       │             │  Row Level Security  │
│  /api/admin      │             └──────────────────────┘
│  /api/ai         │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   OpenAI API     │
│   (GPT-4o)       │
│                  │
│  Recomendações   │
│  Sugestão preço  │
└──────────────────┘
```

### Fluxo de Dados

1. O frontend se comunica com o **Supabase** diretamente para autenticação e dados públicos
2. Operações sensíveis (admin, IA, taxa de plataforma) passam pelo **backend Express**
3. Lances de leilão são propagados em tempo real via **Supabase Realtime**
4. O backend consulta o **OpenAI GPT-4o** para recomendações e sugestões de preço

---

## Tecnologias Utilizadas

| Camada | Tecnologia | Versão |
|---|---|---|
| Frontend | React | 18.3 |
| Frontend | Vite | 5.4 |
| Frontend | React Router | 6.26 |
| Frontend | Supabase JS | 2.45 |
| Backend | Node.js | 18+ |
| Backend | Express | 4.19 |
| Backend | Supabase JS | 2.45 |
| Backend | OpenAI SDK | 4.52 |
| Banco de Dados | PostgreSQL (Supabase) | - |
| Autenticação | Supabase Auth | - |
| Storage | Supabase Storage | - |
| Realtime | Supabase Realtime | - |
| Dev | Concurrently | 8.2 |
| Dev | Nodemon | 3.1 |

---

## Funcionalidades

### Usuário
- Cadastro e login via Supabase Auth
- Onboarding com tipo de perfil (produtor / proprietário / ambos)
- Busca e filtro de equipamentos por cidade, estado e categoria
- Solicitação de aluguel e acompanhamento de status
- Participação em leilões com lances em tempo real
- Avaliação 5 estrelas após locação concluída
- Dashboard com resumo de aluguéis e equipamentos
- Perfil editável com foto

### Proprietário
- Cadastro de equipamentos com fotos, categoria, preço/dia e localização
- Gerenciamento de solicitações de aluguel (confirmar / cancelar)
- Criação de leilões com preço inicial, incremento mínimo e datas
- Sugestão automática de preço via IA

### Produtor
- Recomendação de equipamentos via IA (informa cultura, solo e área)
- Histórico de aluguéis

### Admin
- Aprovação / rejeição de equipamentos cadastrados
- Bloqueio de contas de usuários
- Visualização de taxa de plataforma (1%) por locação
- Painel de contabilidade consolidado

---

## Estrutura de Diretórios

```
mercagro/
├── client/                      # Frontend React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/          # Header
│   │   │   ├── auction/         # Componentes de leilão
│   │   │   ├── equipment/       # Componentes de equipamento
│   │   │   ├── rental/          # Componentes de aluguel
│   │   │   └── ui/              # Componentes genéricos
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # Estado global de autenticação
│   │   ├── hooks/               # Custom hooks
│   │   ├── lib/
│   │   │   ├── api.js           # Cliente HTTP (fetch + JWT)
│   │   │   └── supabase.js      # Instância do Supabase
│   │   ├── pages/               # 15 páginas da aplicação
│   │   ├── App.jsx              # Roteamento principal
│   │   └── main.jsx
│   ├── vite.config.js
│   ├── package.json
│   └── .env                     # Variáveis do frontend
│
├── server/                      # Backend Express.js
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── equipmentController.js
│   │   │   ├── rentalController.js
│   │   │   ├── auctionController.js
│   │   │   ├── adminController.js
│   │   │   └── aiController.js
│   │   ├── routes/
│   │   │   ├── equipment.js
│   │   │   ├── rentals.js
│   │   │   ├── auctions.js
│   │   │   ├── auth.js
│   │   │   ├── admin.js
│   │   │   └── ai.js
│   │   ├── middleware/
│   │   │   ├── auth.js          # Verifica JWT do Supabase
│   │   │   ├── adminAuth.js     # Verifica flag is_admin
│   │   │   └── errorHandler.js
│   │   ├── services/
│   │   │   └── openaiService.js
│   │   ├── lib/
│   │   │   └── supabase.js      # Supabase com service role key
│   │   └── index.js
│   ├── package.json
│   └── .env                     # Variáveis do backend
│
├── supabase/
│   └── migrations/              # Migrations do banco de dados
│       ├── 001_profiles.sql
│       ├── 002_equipment.sql
│       ├── 003_rentals.sql
│       ├── 004_auctions.sql
│       ├── 005_reviews.sql
│       └── 006_admin.sql
│
├── scripts/                     # Utilitários de banco e demo
│   ├── migrate.js               # Executa migrations
│   ├── setup-admin.js           # Cria usuário admin
│   └── ...
│
├── seed.js                      # Popula banco com dados de exemplo
├── .env.example                 # Modelo de variáveis de ambiente
└── package.json                 # Scripts raiz (dev, install:all)
```

---

## Banco de Dados

O banco é PostgreSQL gerenciado pelo Supabase. Todas as tabelas possuem **Row Level Security (RLS)** ativado.

### Tabelas

| Tabela | Descrição |
|---|---|
| `profiles` | Perfis de usuário (nome, CPF/CNPJ, tipo, localização) |
| `equipment` | Equipamentos cadastrados (categoria, preço, fotos, status) |
| `rentals` | Locações (datas, valor total, taxa de plataforma, status) |
| `auctions` | Leilões (preço inicial, incremento, datas, ganhador) |
| `bids` | Lances de leilão (valor, usuário, timestamp) |
| `reviews` | Avaliações após locação (nota 1-5, comentário) |

### Campos de status

- **equipment.status**: `available` | `rented` | `auction` | `inactive`
- **equipment.approval_status**: `pending` | `approved` | `rejected`
- **rentals.status**: `pending` | `confirmed` | `active` | `completed` | `cancelled`
- **auctions.status**: `scheduled` | `active` | `finished` | `cancelled`

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) >= 18
- Conta no [Supabase](https://supabase.com/) (gratuita)
- Chave de API da [OpenAI](https://platform.openai.com/) (para funcionalidades de IA)
- npm >= 9

---

## Configuração e Instalação

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd mercagro
```

### 2. Instale todas as dependências

```bash
npm run install:all
```

Esse comando instala as dependências da raiz, do client e do server de uma vez.

### 3. Configure as variáveis de ambiente

**Backend** — crie o arquivo `server/.env`:

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=seu_anon_key
SUPABASE_SERVICE_ROLE_KEY=seu_service_role_key
OPENAI_API_KEY=sk-...
PORT=3001
NODE_ENV=development
```

**Frontend** — crie o arquivo `client/.env`:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=seu_anon_key
VITE_API_URL=http://localhost:3001
```

> As chaves do Supabase estão disponíveis em: **Supabase Dashboard → Settings → API**

### 4. Configure o banco de dados

No painel do Supabase, abra o **SQL Editor** e execute as migrations em ordem:

```
supabase/migrations/001_profiles.sql
supabase/migrations/002_equipment.sql
supabase/migrations/003_rentals.sql
supabase/migrations/004_auctions.sql
supabase/migrations/005_reviews.sql
supabase/migrations/006_admin.sql
```

### 5. (Opcional) Popule com dados de exemplo

```bash
node seed.js
```

Insere 51+ equipamentos de exemplo em 15 cidades de 9 estados brasileiros.

### 6. (Opcional) Crie um usuário administrador

```bash
node scripts/setup-admin.js
```

---

## Rodando o Projeto

### Desenvolvimento (frontend + backend juntos)

```bash
npm run dev
```

Inicia simultaneamente:
- Frontend em `http://localhost:5173`
- Backend em `http://localhost:3001`

### Rodar separadamente

```bash
# Apenas o backend
npm run dev:server

# Apenas o frontend
npm run dev:client
```

---

## Scripts Utilitários

| Script | Descrição |
|---|---|
| `npm run install:all` | Instala dependências de todos os pacotes |
| `npm run dev` | Inicia frontend e backend em paralelo |
| `npm run dev:server` | Inicia somente o backend (nodemon) |
| `npm run dev:client` | Inicia somente o frontend (Vite) |
| `node seed.js` | Popula o banco com equipamentos de exemplo |
| `node scripts/setup-admin.js` | Cria usuário administrador |
| `node scripts/migrate.js` | Executa migrations programaticamente |

---

## Rotas da API

Base URL: `http://localhost:3001`

| Método | Rota | Autenticação | Descrição |
|---|---|---|---|
| GET | `/api/equipment` | Pública | Lista equipamentos (filtros: categoria, cidade, estado) |
| GET | `/api/equipment/:id` | Pública | Detalhes de um equipamento |
| POST | `/api/equipment` | Usuario | Cadastra equipamento |
| PUT | `/api/equipment/:id` | Proprietário | Edita equipamento |
| DELETE | `/api/equipment/:id` | Proprietário | Remove equipamento |
| GET | `/api/rentals` | Usuário | Lista aluguéis do usuário |
| POST | `/api/rentals` | Usuário | Solicita aluguel (calcula taxa 1%) |
| PUT | `/api/rentals/:id` | Proprietário | Atualiza status do aluguel |
| GET | `/api/auctions` | Pública | Lista leilões ativos |
| GET | `/api/auctions/:id` | Pública | Detalhes do leilão |
| POST | `/api/auctions` | Proprietário | Cria leilão |
| POST | `/api/auctions/:id/bid` | Usuário | Registra lance |
| POST | `/api/ai/recommend` | Usuário | Recomendação de equipamento via IA |
| POST | `/api/ai/price-suggest` | Proprietário | Sugestão de preço via IA |
| GET | `/api/admin/users` | Admin | Lista usuários |
| PUT | `/api/admin/users/:id/block` | Admin | Bloqueia/desbloqueia usuário |
| GET | `/api/admin/equipment` | Admin | Lista equipamentos pendentes |
| PUT | `/api/admin/equipment/:id/approve` | Admin | Aprova ou rejeita equipamento |
| GET | `/api/admin/accounting` | Admin | Relatório de taxas de plataforma |

---

## Páginas do Frontend

| Rota | Página | Acesso |
|---|---|---|
| `/` | Landing page | Pública |
| `/login` | Login | Pública |
| `/register` | Cadastro | Pública |
| `/onboarding` | Configuração de perfil | Usuário autenticado |
| `/equipment` | Busca de equipamentos | Pública |
| `/equipment/new` | Cadastrar equipamento | Usuário autenticado |
| `/equipment/:id` | Detalhes do equipamento | Pública |
| `/equipment/:id/edit` | Editar equipamento | Proprietário |
| `/auctions` | Lista de leilões | Pública |
| `/auctions/:id` | Lance em tempo real | Pública |
| `/dashboard` | Painel do usuário | Usuário autenticado |
| `/my-rentals` | Meus aluguéis | Usuário autenticado |
| `/my-equipment` | Meus equipamentos | Usuário autenticado |
| `/profile` | Perfil e configurações | Usuário autenticado |
| `/admin` | Painel administrativo | Admin |
