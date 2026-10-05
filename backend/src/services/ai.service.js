import axios from 'axios';

import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const FALLBACK_SUGGESTIONS = ['D’accord', 'Bien sûr !', 'C’est noté'];

const SUGGESTION_COUNT = 3;
const REQUEST_TIMEOUT_MS = 8000;

export async function generateSuggestions(userMessage, contextMessages = []) {
  if (!env.XAI_API_KEY) {
    logger.debug('XAI_API_KEY absent : suggestions IA désactivées');
    return FALLBACK_SUGGESTIONS;
  }

  const prompt = [
    'You are a helpful chat assistant.',
    'Given the following conversation:',
    contextMessages.map((message) => `${message.id}: ${message.text}`).join('\n'),
    `User message: "${userMessage}"`,
    '',
    `Provide exactly ${SUGGESTION_COUNT} short, friendly, varied reply suggestions`,
    '(one line each, max 20 words), numbered 1,2,3.',
  ].join('\n');

  try {
    const { data } = await axios.post(
      `${env.XAI_BASE}/chat/completions`,
      {
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 120,
      },
      {
        headers: {
          Authorization: `Bearer ${env.XAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: REQUEST_TIMEOUT_MS,
      },
    );

    const rawText = data?.choices?.[0]?.message?.content ?? '';
    const parsed = parseSuggestions(rawText);

    while (parsed.length < SUGGESTION_COUNT) {
      parsed.push(FALLBACK_SUGGESTIONS[parsed.length % FALLBACK_SUGGESTIONS.length]);
    }

    return parsed.slice(0, SUGGESTION_COUNT);
  } catch (error) {
    logger.error(
      'Erreur generateSuggestions',
      error.response?.data ?? error.message,
    );
    return FALLBACK_SUGGESTIONS;
  }
}

function parseSuggestions(rawText) {
  return String(rawText)
    .split(/\r?\n/)
    .map((line) => line.replace(/^[\d.)[\]\-\s]+/, '').trim())
    .filter((line) => line.length > 0 && line.length <= 140);
}