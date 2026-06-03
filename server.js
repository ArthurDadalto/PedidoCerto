require('dotenv').config();
const { addBusinessDays } = require('date-fns');
const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { GoogleGenAI } = require('@google/genai');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const verificarAutenticacao = (req, res, next) => {
  const senha = req.headers['authorization'];
  if (senha === process.env.SENHA_MESTRA) {
    return next();
  }
  return res.status(401).json({ error: 'Não autorizado.' });
};

// Aplica o middleware a todas as rotas abaixo
app.use(verificarAutenticacao);

app.get('/verificar-senha', (req, res) => {
  res.status(200).json({ ok: true });
});
// Inicializa a conexão do Prisma usando o Adapter para PostgreSQL
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Inicializa a IA do Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Configura o multer para gravar o arquivo em memória
const upload = multer({ storage: multer.memoryStorage() });

app.post('/upload-pedido', upload.single('arquivo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo PDF foi enviado.' });
    }

    // Extrai o texto do PDF a partir do buffer em memória
    const pdfData = await pdfParse(req.file.buffer);
    const pdfText = pdfData.text;

    const systemInstruction = `Você é um extrator de dados. Retorne APENAS um objeto JSON válido, sem formatação markdown. Regras: 1. fornecedor (nome após FORNECEDOR). 2. cliente_nome. 3. cliente_cnpj (apenas números). 4. cliente_telefone (apenas números após TEL). 5. prazo_pagamento. 6. itens (array de objetos com descricao e quantidade). 7. data_emissao: Extrair a data localizada após a palavra DATA no cabeçalho do documento (exemplo do formato esperado na saída JSON: YYYY-MM-DD).`;

    // Faz a chamada para a API do Gemini
    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: pdfText,
        config: {
          systemInstruction: systemInstruction,
        }
      });
    } catch (apiError) {
      if (apiError.status === 503 || (apiError.message && apiError.message.includes('503'))) {
        return res.status(503).json({ error: 'Os servidores do Google (Gemini) estão temporariamente sobrecarregados devido à alta demanda. Por favor, aguarde alguns minutos e tente novamente.' });
      }
      throw apiError;
    }

    const resultText = response.text;
    
    let parsedData;
    try {
      // Limpa possíveis formatações markdown para não quebrar o JSON.parse
      const cleanText = resultText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedData = JSON.parse(cleanText);
    } catch (e) {
      console.error("Erro no parse do JSON:", resultText);
      return res.status(500).json({ error: 'Erro ao formatar os dados da IA em JSON.' });
    }

    const diasFollowUp = req.body.dias_follow_up ? parseInt(req.body.dias_follow_up, 10) : 45;

    let emissaoDate = new Date();
    if (parsedData.data_emissao) {
      const parsed = new Date(parsedData.data_emissao + 'T12:00:00Z');
      if (!isNaN(parsed.getTime())) {
        emissaoDate = parsed;
      }
    }

    // Salva os dados processados no banco de dados Supabase via Prisma
    const novoPedido = await prisma.pedido.create({
      data: {
        fornecedor: parsedData.fornecedor || "",
        cliente_nome: parsedData.cliente_nome || "",
        cliente_cnpj: parsedData.cliente_cnpj || "",
        cliente_telefone: parsedData.cliente_telefone || "",
        prazo_pagamento: parsedData.prazo_pagamento || "",
        itens: parsedData.itens || [],
        dias_follow_up: diasFollowUp,
        data_emissao: emissaoDate
      }
    });

    return res.status(200).json(novoPedido);
  } catch (error) {
    console.error("Erro no upload:", error);
    return res.status(500).json({ error: 'Erro interno: ' + error.message });
  }
});

app.get('/pedidos-pendentes', async (req, res) => {
  try {
    // Busca todos os pedidos que ainda não foram contatados
    const todosPendentes = await prisma.pedido.findMany({
      where: {
        contatado: false
      },
      orderBy: {
        data_criacao: 'desc'
      }
    });

    const hoje = new Date();
    const pendentesFiltrados = todosPendentes.filter(pedido => {
      // Soma a quantidade de dias úteis da data de emissão
      const dataAlvo = addBusinessDays(new Date(pedido.data_emissao), pedido.dias_follow_up);
      // Verifica se a data alvo é igual ou anterior a hoje
      return dataAlvo <= hoje;
    });

    return res.status(200).json(pendentesFiltrados);
  } catch (error) {
    console.error("Erro na rota /pedidos-pendentes:", error);
    return res.status(500).json({ error: 'Erro ao buscar pedidos pendentes.' });
  }
});

app.put('/pedido-contatado/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pedidoAtualizado = await prisma.pedido.update({
      where: { id },
      data: { contatado: true }
    });
    return res.status(200).json(pedidoAtualizado);
  } catch (error) {
    console.error("Erro ao atualizar status de contato:", error);
    return res.status(500).json({ error: 'Erro ao atualizar pedido.' });
  }
});

// Retorna todos os pedidos (Histórico)
app.get('/pedidos', async (req, res) => {
  try {
    const pedidos = await prisma.pedido.findMany({
      orderBy: { data_criacao: 'desc' }
    });
    return res.status(200).json(pedidos);
  } catch (error) {
    console.error("Erro ao buscar histórico:", error);
    return res.status(500).json({ error: 'Erro ao buscar pedidos.' });
  }
});

// Atualiza um pedido existente
app.put('/pedidos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { fornecedor, cliente_nome, cliente_cnpj, cliente_telefone, prazo_pagamento, itens, dias_follow_up } = req.body;
    
    const pedidoAtualizado = await prisma.pedido.update({
      where: { id },
      data: {
        fornecedor,
        cliente_nome,
        cliente_cnpj,
        cliente_telefone,
        prazo_pagamento,
        itens,
        dias_follow_up: dias_follow_up ? parseInt(dias_follow_up, 10) : undefined
      }
    });
    return res.status(200).json(pedidoAtualizado);
  } catch (error) {
    console.error("Erro ao atualizar pedido:", error);
    return res.status(500).json({ error: 'Erro ao atualizar pedido.' });
  }
});

// Exclui um pedido
app.delete('/pedidos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.pedido.delete({
      where: { id }
    });
    return res.status(200).json({ message: 'Pedido excluído com sucesso.' });
  } catch (error) {
    console.error("Erro ao excluir pedido:", error);
    return res.status(500).json({ error: 'Erro ao excluir pedido.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor Express rodando na porta ${PORT}`);
});
