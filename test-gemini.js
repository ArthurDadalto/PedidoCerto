require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Qual o seu nome?',
    });
    console.log("Success:", response.text);
  } catch (err) {
    console.error("Error:", err.message);
  }
}
run();
