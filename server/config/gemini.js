import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from './env.js';

let client = null;

/**
 * Lazily creates (and memoizes) the Gemini client so importing this module
 * never throws in environments where the AI features aren't exercised yet.
 * Callers should use getGeminiModel() rather than reaching into `client`.
 */
export function getGeminiModel(modelName = env.gemini.model) {
  if (!env.gemini.apiKey) {
    throw new Error('GEMINI_API_KEY is not set — AI features are unavailable.');
  }

  if (!client) {
    client = new GoogleGenerativeAI(env.gemini.apiKey);
  }

  return client.getGenerativeModel({ model: modelName });
}
