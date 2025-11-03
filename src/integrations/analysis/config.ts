export const ANALYSIS_CONFIG = {
  embeddingModel: 'llama-embed-v1',   // or whatever your local model ID is
  embeddingDimensions: 384,           // ← critical change
  defaultAssemble: {
    perSourceK: { project: 4, context: 3, sentiment: 2, framework: 6 },
    maxChars: 12000,
  },
};
