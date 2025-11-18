import dotenv from "dotenv";
dotenv.config({path:'../.env'});
import axios from 'axios';

const apiKey = process.env.XAI_API_KEY;
const baseUrl = process.env.XAI_BASE;



async function askGroq(message) {
  try {
    const url = `${baseUrl}/chat/completions`;

    const body = {
      model: "llama-3.1-8b-instant", 
      messages: [
        { role: "user", content: message }
      ]
    };

    const headers = {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    };

    const response = await axios.post(url, body, { headers });
    
    console.log("Réponse Groq :");
    
    console.log(response.data.choices[0].message.content);
  } catch (err) {
    console.error("Erreur API Groq :", err.response?.data || err.message);
  }
}

// Test
askGroq("Explique moi Node.js en une phrase");
