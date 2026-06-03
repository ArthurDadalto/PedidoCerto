# CRM Comercial AI - Controle de Reposição

## 📖 Visão Geral
O **CRM Comercial AI** é um sistema moderno criado para gestão de representação comercial. Seu foco principal é automatizar e gerenciar o *follow-up* de reposição de estoque de clientes de supermercados e atacados. A ferramenta traz agilidade, inteligência e organização para o dia a dia do representante comercial.

## ✨ Funcionalidades Principais
- **Extração Inteligente por IA:** Extração automática dos dados de relatórios de vendas em PDF utilizando a API do **Google Gemini AI**.
- **Datas Inteligentes:** Cálculo dinâmico das datas de follow-up (variando de 15 a 45 dias), considerando **apenas dias úteis** e baseando-se na data real de emissão do relatório.
- **Disparo de WhatsApp:** Integração direta com WhatsApp, gerando mensagens personalizadas com apenas um clique para envio aos clientes cujo estoque precisa de reposição.
- **Painel de Histórico (CRUD):** Interface completa para listar, visualizar, editar e excluir permanentemente qualquer registro de pedido, com atualizações em tempo real.
- **Segurança (Senha Mestra):** Proteção integral de todas as rotas e componentes utilizando um sistema de bloqueio por Senha Mestra (com verificação local e via middleware no backend).

## 🛠️ Stack Tecnológica
- **Node.js** com **Express** (Backend REST API)
- **React** (Frontend / UI Interativa)
- **Tailwind CSS** (Estilização com padrão Glassmorphism)
- **Prisma ORM** (Modelagem e manipulação do banco de dados)
- **PostgreSQL** hospedado no **Supabase**
- **Google Gemini AI** (Modelo `gemini-2.5-flash` para processamento de linguagem natural e extração de dados em PDFs)
- **Date-fns** (Manipulação avançada de datas úteis)

## 🚀 Como Rodar Localmente

Siga o passo a passo abaixo para rodar a aplicação no seu ambiente:

### 1. Clonar o Repositório
```bash
git clone https://github.com/SEU_USUARIO/crm-comercial-ai.git
cd crm-comercial-ai
```

### 2. Instalar Dependências
O projeto é dividido em Backend (raiz) e Frontend. Você precisa instalar as dependências em ambos.
```bash
# Na pasta raiz (Backend)
npm install

# Na pasta do Frontend
cd frontend
npm install
cd ..
```

### 3. Configurar as Variáveis de Ambiente
Crie um arquivo `.env` na pasta raiz e adicione as seguintes chaves:
```env
DATABASE_URL="Sua_Url_Do_PostgreSQL_No_Supabase"
GEMINI_API_KEY="Sua_Chave_De_API_Do_Google_Gemini"
SENHA_MESTRA="Sua_Senha_De_Acesso_Para_O_Sistema"
```

### 4. Preparar o Banco de Dados
Sincronize a estrutura do Prisma com o seu PostgreSQL:
```bash
npx prisma db push
```

### 5. Iniciar os Servidores
Abra **dois terminais**.

Terminal 1 (Backend):
```bash
node server.js
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

O painel ficará disponível no seu navegador em `http://localhost:5173`. Insira a sua Senha Mestra para acessar!
