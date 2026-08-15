import { GoogleGenAI } from '@google/genai';

/**
 * Priority list of Gemini models with fallbacks:
 * 1. gemini-3.7-flash (Primary)
 * 2. gemini-3.6-flash (First fallback)
 * 3. gemini-3.5-flash-lite (Second fallback)
 */
export const GEMINI_FALLBACK_MODELS = [
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash-lite',
] as const;

export type SupportedGeminiModel = (typeof GEMINI_FALLBACK_MODELS)[number];

let geminiClientInstance: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on server');
  }
  if (!geminiClientInstance) {
    geminiClientInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClientInstance;
}

export interface GenerateWithFallbackParams {
  contents: any;
  config?: any;
  models?: readonly string[];
}

export interface GenerateWithFallbackResult {
  response: any;
  modelUsed: string;
}

/**
 * Executes a generateContent call against Gemini with automatic fallback to
 * gemini-3.6-flash and gemini-3.5-flash-lite if the primary model fails.
 */
export async function generateContentWithFallback(
  ai: GoogleGenAI,
  params: GenerateWithFallbackParams
): Promise<GenerateWithFallbackResult> {
  const modelsToTry = params.models && params.models.length > 0 ? params.models : GEMINI_FALLBACK_MODELS;
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });

      return { response, modelUsed: model };
    } catch (err: any) {
      console.warn(`[Gemini Fallback] Model ${model} encountered an issue: ${err?.message || err}. Trying next fallback model...`);
      lastError = err;
    }
  }

  throw lastError || new Error('All Gemini fallback models (gemini-3.7-flash, gemini-3.6-flash, gemini-3.5-flash-lite) failed.');
}
