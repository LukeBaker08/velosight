import { AzureOpenAI } from "openai";

// Lazy initialization to avoid accessing env vars at module load time
let client: AzureOpenAI | null = null;

function getClient(): AzureOpenAI {
  if (!client) {
    client = new AzureOpenAI({
      apiKey: import.meta.env.VITE_AZURE_OPENAI_KEY,
      endpoint: import.meta.env.VITE_AZURE_OPENAI_ENDPOINT,
      apiVersion: "2024-08-01-preview",
      dangerouslyAllowBrowser: true // ⚠️ NOT PRODUCTION READY - API keys exposed in browser
    });
  }
  return client;
}

/**
 * Generate embedding vector for text using Azure OpenAI
 * @param text Text to embed
 * @returns 1536-dimensional embedding vector
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await getClient().embeddings.create({
    model: import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT_EMBEDDING!,
    input: text
  });

  return response.data[0].embedding;
}

/**
 * Generate analysis using Azure OpenAI GPT-4o with JSON mode
 * @param systemPrompt System instructions
 * @param userPrompt User query/request
 * @param temperature Randomness (0-1, default 0 for deterministic)
 * @returns JSON string from GPT-4o
 */
export async function generateAnalysis(
  systemPrompt: string,
  userPrompt: string,
  temperature: number = 0
): Promise<string> {
  const response = await getClient().chat.completions.create({
    model: import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT_GPT4O!,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature,
    response_format: { type: "json_object" }
  });

  return response.choices[0]?.message?.content || "{}";
}
