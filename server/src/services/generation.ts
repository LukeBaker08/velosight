import { createClient } from '@supabase/supabase-js';
import { generateAnalysis, type OutputSchema } from './azure-openai.js';
import { retrieveTriangulatedContext, formatContextForLLM } from './retrieval.js';

// Create Supabase client for server-side using SERVICE ROLE KEY (bypasses RLS)
// This is safe because this code runs on our backend server, not in the browser
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!
);

/**
 * Analysis type configuration from Supabase
 */
export interface AnalysisType {
  id: string;
  key: string;
  name: string;
  description: string | null;
  icon: string;
  icon_color: string;
  system_prompt: string;
  user_prompt_template: string;
  enabled: boolean;
  sort_order: number;
  requires_subtype: boolean;
  subtypes: string[] | null;
  output_schema: OutputSchema | null;
}

/**
 * Analysis request parameters
 */
export interface AnalysisRequest {
  projectId: string;
  analysisTypeKey: string;
  query?: string;
  subtype?: string;
  topK?: number;
}

/**
 * Analysis result structure
 */
export interface AnalysisResult {
  success: boolean;
  analysisType: string;
  analysisSubtype?: string;
  output: any;
  confidence?: string;
  overallRating?: string;
  contextCounts: {
    framework: number;
    context: number;
    project: number;
    sentiment: number;
  };
  error?: string;
}

/**
 * Fetch analysis type configuration from Supabase
 */
export async function getAnalysisType(key: string): Promise<AnalysisType | null> {
  const { data, error } = await supabase
    .from('analysis_types')
    .select('*')
    .eq('key', key)
    .eq('enabled', true)
    .single();

  if (error) {
    console.error(`[Generation] Failed to fetch analysis type '${key}':`, error.message);
    return null;
  }

  // Parse subtypes if it's a string
  if (data.subtypes && typeof data.subtypes === 'string') {
    try {
      data.subtypes = JSON.parse(data.subtypes);
    } catch {
      data.subtypes = null;
    }
  }

  return data;
}

/**
 * Fetch all enabled analysis types
 */
export async function getAllAnalysisTypes(): Promise<AnalysisType[]> {
  const { data, error } = await supabase
    .from('analysis_types')
    .select('*')
    .eq('enabled', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[Generation] Failed to fetch analysis types:', error.message);
    return [];
  }

  // Parse subtypes for each type
  return data.map(item => ({
    ...item,
    subtypes: item.subtypes && typeof item.subtypes === 'string'
      ? JSON.parse(item.subtypes)
      : item.subtypes
  }));
}

/**
 * Fetch all analysis types (including disabled) for admin settings
 */
export async function getAllAnalysisTypesAdmin(): Promise<AnalysisType[]> {
  const { data, error } = await supabase
    .from('analysis_types')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[Generation] Failed to fetch analysis types (admin):', error.message);
    return [];
  }

  return data.map(item => ({
    ...item,
    subtypes: item.subtypes && typeof item.subtypes === 'string'
      ? JSON.parse(item.subtypes)
      : item.subtypes
  }));
}

/**
 * Update analysis type parameters (system prompt, user prompt, output schema)
 */
export async function updateAnalysisType(
  id: string,
  updates: {
    system_prompt: string;
    user_prompt_template: string;
    output_schema: any;
  }
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('analysis_types')
    .update({
      system_prompt: updates.system_prompt,
      user_prompt_template: updates.user_prompt_template,
      output_schema: updates.output_schema,
    })
    .eq('id', id);

  if (error) {
    console.error(`[Generation] Failed to update analysis type ${id}:`, error.message);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Extract confidence rating from LLM output
 */
function extractConfidence(output: any): string | null {
  try {
    const cl = output?.SelfAwareness?.ConfidenceLevelRating;
    if (cl?.rating) return cl.rating;
  } catch {
    // Ignore extraction errors
  }
  return null;
}

/**
 * Extract overall rating from LLM output (handles different analysis formats)
 */
function extractOverallRating(output: any): string | null {
  try {
    // Risk Analysis format (new schema)
    if (output?.OverallRating?.riskRating) {
      return output.OverallRating.riskRating;
    }
    // DCA format (new schema)
    if (output?.DeliveryConfidenceAssessment?.overallDeliveryConfidenceRating) {
      return output.DeliveryConfidenceAssessment.overallDeliveryConfidenceRating;
    }
    // DCA format (legacy)
    if (output?.overallRating) {
      return output.overallRating;
    }
    // Gateway Review format
    if (output?.GatewayReviewAssessment?.overallRating) {
      return output.GatewayReviewAssessment.overallRating;
    }
    // Hypothesis - use evidence strength of top hypothesis
    if (output?.hypotheses?.[0]?.potentialImpact) {
      return output.hypotheses[0].potentialImpact;
    }
  } catch {
    // Ignore extraction errors
  }
  return null;
}

/**
 * Run analysis using RAG retrieval and LLM generation
 * Single API call that:
 * 1. Fetches analysis type config from Supabase
 * 2. Retrieves triangulated context from Azure AI Search
 * 3. Generates analysis using Azure OpenAI
 * 4. Saves result to Supabase analysis_results table
 */
export async function runAnalysis(request: AnalysisRequest): Promise<AnalysisResult> {
  const { projectId, analysisTypeKey, query, subtype, topK = 3 } = request;

  console.log(`[Generation] Running analysis: ${analysisTypeKey} for project ${projectId}`);

  // Step 1: Fetch analysis type configuration
  const analysisType = await getAnalysisType(analysisTypeKey);
  if (!analysisType) {
    return {
      success: false,
      analysisType: analysisTypeKey,
      output: null,
      contextCounts: { framework: 0, context: 0, project: 0, sentiment: 0 },
      error: `Analysis type '${analysisTypeKey}' not found or disabled`
    };
  }

  // Validate subtype if required
  if (analysisType.requires_subtype && !subtype) {
    return {
      success: false,
      analysisType: analysisType.name,
      output: null,
      contextCounts: { framework: 0, context: 0, project: 0, sentiment: 0 },
      error: `Analysis type '${analysisType.name}' requires a subtype`
    };
  }

  try {
    // Step 2: Retrieve triangulated context
    const contextQuery = query || analysisType.description || `Perform ${analysisType.name}`;
    console.log(`[Generation] Retrieving context for: "${contextQuery.substring(0, 50)}..."`);

    const context = await retrieveTriangulatedContext(projectId, contextQuery, topK);
    const formattedContext = formatContextForLLM(context);

    const contextCounts = {
      framework: context.framework_data.length,
      context: context.context_data.length,
      project: context.project_data.length,
      sentiment: context.sentiment_data.length
    };

    console.log(`[Generation] Context retrieved: F=${contextCounts.framework}, C=${contextCounts.context}, P=${contextCounts.project}, S=${contextCounts.sentiment}`);

    // Step 3: Build prompts
    const systemPrompt = analysisType.system_prompt;

    // Replace placeholders in user prompt template
    let userPrompt = analysisType.user_prompt_template
      .replace('{context}', formattedContext)
      .replace('{query}', contextQuery);

    // Replace subtype if present
    if (subtype) {
      userPrompt = userPrompt.replace('{subtype}', subtype);
    }

    // Step 4: Generate analysis with LLM (structured output enforcement when schema available)
    const hasSchema = !!analysisType.output_schema;
    console.log(`[Generation] Calling Azure OpenAI for ${analysisType.name} (structured output: ${hasSchema})...`);
    const rawOutput = await generateAnalysis(systemPrompt, userPrompt, 0, analysisType.output_schema);

    // Step 5: Parse JSON output
    let output: any;
    try {
      output = JSON.parse(rawOutput);
    } catch (parseError) {
      console.error('[Generation] Failed to parse LLM output as JSON:', parseError);
      // Try to extract JSON from text
      const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        output = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('LLM response is not valid JSON');
      }
    }

    // Step 6: Extract metadata
    const confidence = extractConfidence(output) || 'Medium';
    const overallRating = extractOverallRating(output);

    // Step 7: Save to Supabase (include prompt for custom analyses)
    console.log(`[Generation] Saving result to Supabase...`);
    const rawResult = analysisTypeKey === 'custom-prompt'
      ? { prompt: query, output: output.response || (typeof output === 'string' ? output : JSON.stringify(output)) }
      : output;

    const { data: savedResult, error: saveError } = await supabase
      .from('analysis_results')
      .insert({
        project_id: projectId,
        analysis_type: analysisType.name,
        analysis_subtype: subtype || null,
        confidence,
        overall_rating: overallRating,
        raw_result: rawResult,
        status: 'draft'
      })
      .select()
      .single();

    if (saveError) {
      console.error('[Generation] Failed to save to Supabase:', saveError);
      // Don't fail the whole operation - return the result anyway
    } else {
      console.log(`[Generation] Saved analysis with ID: ${savedResult?.id}`);
    }

    return {
      success: true,
      analysisType: analysisType.name,
      analysisSubtype: subtype,
      output: {
        ...output,
        id: savedResult?.id,
        created_at: savedResult?.created_at
      },
      confidence,
      overallRating: overallRating || undefined,
      contextCounts
    };

  } catch (error: any) {
    console.error(`[Generation] Error running analysis:`, error);
    return {
      success: false,
      analysisType: analysisType.name,
      analysisSubtype: subtype,
      output: null,
      contextCounts: { framework: 0, context: 0, project: 0, sentiment: 0 },
      error: error.message || 'Analysis generation failed'
    };
  }
}
