import { AzureOpenAI } from "openai";

// Server-side Azure OpenAI client (uses process.env, no dangerouslyAllowBrowser needed)
let client: AzureOpenAI | null = null;

function getClient(): AzureOpenAI {
  if (!client) {
    client = new AzureOpenAI({
      apiKey: process.env.AZURE_OPENAI_KEY!,
      endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
      apiVersion: "2024-08-01-preview"
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
    model: process.env.AZURE_OPENAI_DEPLOYMENT_EMBEDDING!,
    input: text
  });

  return response.data[0].embedding;
}

/**
 * Output schema definition stored in the analysis_types table.
 * Passed directly to Azure OpenAI's response_format.json_schema.
 */
export interface OutputSchema {
  name: string;
  strict: boolean;
  schema: Record<string, any>;
}

/**
 * Generate analysis using Azure OpenAI GPT-4o with structured output enforcement.
 * When an outputSchema is provided, uses json_schema response format
 * (enforced at the API level). Otherwise falls back to json_object mode.
 *
 * @param systemPrompt System instructions
 * @param userPrompt User query/request
 * @param temperature Randomness (0-1, default 0 for deterministic)
 * @param outputSchema Optional JSON Schema for structured output enforcement
 * @returns JSON string from GPT-4o
 */
export async function generateAnalysis(
  systemPrompt: string,
  userPrompt: string,
  temperature: number = 0,
  outputSchema?: OutputSchema | null
): Promise<string> {
  let responseFormat: any;

  if (outputSchema && outputSchema.name && outputSchema.schema) {
    console.log(`[AzureOpenAI] Using json_schema response format: name=${outputSchema.name}, strict=${outputSchema.strict}`);
    responseFormat = {
      type: "json_schema" as const,
      json_schema: {
        name: outputSchema.name,
        strict: outputSchema.strict ?? true,
        schema: outputSchema.schema
      }
    };
  } else {
    console.log(`[AzureOpenAI] Using json_object response format (schema: ${JSON.stringify(outputSchema === null ? 'null' : typeof outputSchema)})`);
    responseFormat = { type: "json_object" as const };

    // Azure OpenAI requires the word "json" to appear in the messages when using json_object mode
    if (!systemPrompt.toLowerCase().includes('json') && !userPrompt.toLowerCase().includes('json')) {
      systemPrompt += '\nRespond in JSON format.';
    }
  }

  const response = await getClient().chat.completions.create({
    model: process.env.AZURE_OPENAI_DEPLOYMENT_GPT4O!,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature,
    response_format: responseFormat
  });

  return response.choices[0]?.message?.content || "{}";
}
