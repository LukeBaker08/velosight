import { Router } from 'express';
import {
  runAnalysis,
  getAllAnalysisTypes,
  getAllAnalysisTypesAdmin,
  getAnalysisType,
  updateAnalysisType,
  getRetrievalSettings,
  updateRetrievalSettings
} from '../services/generation.js';

export const analysisRouter = Router();

/**
 * GET /api/analysis/types
 * Fetch all enabled analysis types (for frontend to dynamically render tiles)
 */
analysisRouter.get('/types', async (req, res) => {
  try {
    console.log('[API] Fetching all analysis types');

    const types = await getAllAnalysisTypes();

    // Return simplified data for frontend (exclude full prompts)
    const simplifiedTypes = types.map(t => ({
      id: t.id,
      key: t.key,
      name: t.name,
      description: t.description,
      icon: t.icon,
      iconColor: t.icon_color,
      sortOrder: t.sort_order,
      requiresSubtype: t.requires_subtype,
      subtypes: t.subtypes
    }));

    res.json({
      success: true,
      data: simplifiedTypes
    });
  } catch (error: any) {
    console.error('[API] Error fetching analysis types:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch analysis types'
    });
  }
});

/**
 * GET /api/analysis/types/admin/all
 * Fetch all analysis types with full details (for settings editor)
 * NOTE: Must be registered before /types/:key to avoid the wildcard capturing "admin"
 */
analysisRouter.get('/types/admin/all', async (req, res) => {
  try {
    console.log('[API] Fetching all analysis types (admin)');
    const types = await getAllAnalysisTypesAdmin();
    res.json({ success: true, data: types });
  } catch (error: any) {
    console.error('[API] Error fetching analysis types (admin):', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch analysis types'
    });
  }
});

/**
 * GET /api/analysis/types/:key
 * Fetch a specific analysis type by key
 */
analysisRouter.get('/types/:key', async (req, res) => {
  try {
    const { key } = req.params;
    console.log(`[API] Fetching analysis type: ${key}`);

    const type = await getAnalysisType(key);

    if (!type) {
      return res.status(404).json({
        success: false,
        error: `Analysis type '${key}' not found`
      });
    }

    // Return simplified data (exclude full prompts for security)
    res.json({
      success: true,
      data: {
        id: type.id,
        key: type.key,
        name: type.name,
        description: type.description,
        icon: type.icon,
        iconColor: type.icon_color,
        requiresSubtype: type.requires_subtype,
        subtypes: type.subtypes
      }
    });
  } catch (error: any) {
    console.error('[API] Error fetching analysis type:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch analysis type'
    });
  }
});

/**
 * PUT /api/analysis/types/:id
 * Update analysis type parameters (system prompt, user prompt, output schema)
 */
analysisRouter.put('/types/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { system_prompt, user_prompt_template, output_schema } = req.body;

    if (!id) {
      return res.status(400).json({ success: false, error: 'Missing analysis type ID' });
    }

    console.log(`[API] Updating analysis type: ${id}`);

    const result = await updateAnalysisType(id, {
      system_prompt,
      user_prompt_template,
      output_schema,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error: any) {
    console.error('[API] Error updating analysis type:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update analysis type'
    });
  }
});

/**
 * POST /api/analysis/run
 * Run an analysis - single endpoint for all analysis types
 * Retrieval settings (topK per category) are fetched from app_settings table
 *
 * Request body:
 * {
 *   projectId: string (required)
 *   analysisTypeKey: string (required) - e.g., 'risk-analysis', 'delivery-confidence'
 *   query?: string - optional custom query (defaults to analysis description)
 *   subtype?: string - required for gateway-review, optional for others
 * }
 */
analysisRouter.post('/run', async (req, res) => {
  try {
    const { projectId, analysisTypeKey, query, subtype } = req.body;

    // Validate required fields
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: projectId'
      });
    }

    if (!analysisTypeKey) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: analysisTypeKey'
      });
    }

    console.log(`[API] Running analysis: ${analysisTypeKey} for project ${projectId}`);
    if (subtype) console.log(`[API] Subtype: ${subtype}`);

    // Run the analysis (retrieval settings are fetched from database)
    const result = await runAnalysis({
      projectId,
      analysisTypeKey,
      query,
      subtype
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error: any) {
    console.error('[API] Error running analysis:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Analysis failed'
    });
  }
});

/**
 * GET /api/analysis/settings/retrieval
 * Get current retrieval settings (topK values per category)
 */
analysisRouter.get('/settings/retrieval', async (req, res) => {
  try {
    console.log('[API] Fetching retrieval settings');
    const settings = await getRetrievalSettings();
    res.json({ success: true, data: settings });
  } catch (error: any) {
    console.error('[API] Error fetching retrieval settings:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch retrieval settings'
    });
  }
});

/**
 * PUT /api/analysis/settings/retrieval
 * Update retrieval settings (topK values per category)
 *
 * Request body:
 * {
 *   framework_topk?: number
 *   context_topk?: number
 *   project_topk?: number
 *   sentiment_topk?: number
 * }
 */
analysisRouter.put('/settings/retrieval', async (req, res) => {
  try {
    const { framework_topk, context_topk, project_topk, sentiment_topk } = req.body;

    console.log('[API] Updating retrieval settings:', req.body);

    const result = await updateRetrievalSettings({
      framework_topk,
      context_topk,
      project_topk,
      sentiment_topk
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Return updated settings
    const updatedSettings = await getRetrievalSettings();
    res.json({ success: true, data: updatedSettings });
  } catch (error: any) {
    console.error('[API] Error updating retrieval settings:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update retrieval settings'
    });
  }
});
