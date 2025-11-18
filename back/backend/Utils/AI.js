import dotenv from "dotenv";
dotenv.config({path:'../.env'});
import axios from 'axios';

const apiKey = process.env.XAI_API_KEY;
const baseUrl = process.env.XAI_BASE;



export async function generateSuggestions(userMessage, contextMessages = []) {
  try {
    const prompt = `
You are a helpful chat assistant.
Given the following conversation:
${contextMessages.map(m => `${m.id}: ${m.text}`).join("\n")}
User message: "${userMessage}"

Provide exactly 3 short, friendly, varied reply suggestions (one line each, max 20 words), numbered 1,2,3.
`;

    const response = await axios.post(
      `${baseUrl}/chat/completions`,
      {
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const rawText = response.data.choices[0].message.content;
    const lines = rawText
      .split(/\r?\n/)
      .map(l => l.replace(/^[\d\.\)\-\s]+/, "").trim())
      .filter(Boolean);

    while (lines.length < 3) lines.push("…"); 
    return lines.slice(0, 3);
  } catch (err) {
    console.error("Erreur generateSuggestions:", err.response?.data || err.message);
    return ["…", "…", "…"];
  }
}

/* // ---------- MOCK DATA ----------
const mockContext = [
  { id: "Alice", text: "Salut, tu vas au café ce soir ?" },
  { id: "Bob", text: "Oui, je pense y aller vers 19h." }
];

const userMessage = "Je peux venir avec mon ami, ça dérange ?";

// Test rapide
generateSuggestions(userMessage, mockContext).then(suggestions => {
  console.log("=== Suggestions AI ===");
  suggestions.forEach((s, i) => console.log(`${i + 1}. ${s}`));
}); */
