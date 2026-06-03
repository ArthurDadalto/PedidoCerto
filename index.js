require('dotenv').config();
const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { GoogleGenAI } = require('@google/genai');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const app = express();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Configuração do Multer para salvar em memória
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());

const systemInstruction = `Você é um assistente especializado em extração de dados estruturados de notas de pedido comerciais em formato de texto bruto. Sua única função é ler o texto fornecido e retornar estritamente um objeto JSON válido, sem formatações markdown, sem blocos de código e sem nenhum texto adicional. Regras de Extração: 1. fornecedor: Extrair o nome da empresa após FORNECEDOR. 2. cliente_nome: Extrair o nome fantasia ou razão social. 3. cliente_cnpj: Extrair a string do CNPJ apenas com números. 4. cliente_telefone: Extrair o número após TEL apenas com números. 5. prazo_pagamento: Extrair o texto após PRAZO. 6. itens: Criar um array de objetos com descricao e quantidade extraídos da seção PRODUTO.`;

app.post('/upload-pedido', upload.single('arquivo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo PDF foi enviado.' });
    }

    // 1. Extrair o texto do PDF
    const pdfData = await pdfParse(req.file.buffer);
    const pdfText = pdfData.text;

    // 2. Chamar a API do Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: pdfText,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    const resultText = response.text;

    // 3. Fazer o JSON parse
    let parsedData;
    try {
      // Limpar possíveis formatações markdown caso o modelo as inclua
      const cleanText = resultText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedData = JSON.parse(cleanText);
    } catch (e) {
      console.error("Erro no parse do JSON:", resultText);
      return res.status(500).json({ error: 'Erro ao interpretar os dados da IA.' });
    }

    // 4. Salvar os dados processados no banco de dados via Prisma
    const novoPedido = await prisma.pedido.create({
      data: {
        fornecedor: parsedData.fornecedor || "",
        cliente_nome: parsedData.cliente_nome || "",
        cliente_cnpj: parsedData.cliente_cnpj || "",
        cliente_telefone: parsedData.cliente_telefone || "",
        prazo_pagamento: parsedData.prazo_pagamento || "",
        itens: parsedData.itens || []
      }
    });

    // 5. Retornar status 200 com os dados salvos
    return res.status(200).json(novoPedido);

  } catch (error) {
    console.error("Erro interno no servidor:", error);
    return res.status(500).json({ error: 'Ocorreu um erro interno ao processar o pedido.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
