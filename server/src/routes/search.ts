import { Router } from 'express';
import {
  searchProjectDocuments,
  searchFrameworkMaterials,
  retrieveTriangulatedContext,
  formatContextForLLM
} from '../services/retrieval.js';

export const searchRouter = Router();

/**
 * POST /api/search/project
 * Search project documents (project, context, or sentiment categories)
 */
searchRouter.post('/project', async (req, res) => {
  try {
    const { projectId, query, category, topK = 5 } = req.body;

    // Validate required fields
    if (!projectId || !query) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: projectId, query'
      });
    }

    // Validate category if provided
    if (category && !['project', 'context', 'sentiment'].includes(category)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category. Must be: project, context, or sentiment'
      });
    }

    console.log(`[API] Search project docs: "${query.substring(0, 30)}..." (category: ${category || 'all'})`);

    // If no category specified, search all project categories
    if (!category) {
      const [project, context, sentiment] = await Promise.all([
        searchProjectDocuments(projectId, query, 'project', topK),
        searchProjectDocuments(projectId, query, 'context', topK),
        searchProjectDocuments(projectId, query, 'sentiment', topK)
      ]);

      res.json({
        success: true,
        data: {
          project,
          context,
          sentiment,
          total: project.length + context.length + sentiment.length
        }
      });
    } else {
      const results = await searchProjectDocuments(projectId, query, category, topK);
      res.json({
        success: true,
        data: {
          results,
          total: results.length
        }
      });
    }
  } catch (error: any) {
    console.error('[API] Project search error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Search failed'
    });
  }
});

/**
 * POST /api/search/framework
 * Search framework materials
 */
searchRouter.post('/framework', async (req, res) => {
  try {
    const { query, type, topK = 5 } = req.body;

    // Validate required fields
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: query'
      });
    }

    console.log(`[API] Search framework: "${query.substring(0, 30)}..."${type ? ` (type: ${type})` : ''}`);

    const results = await searchFrameworkMaterials(query, topK, type);

    res.json({
      success: true,
      data: {
        results,
        total: results.length
      }
    });
  } catch (error: any) {
    console.error('[API] Framework search error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Search failed'
    });
  }
});

/**
 * POST /api/search/triangulate
 * Retrieve context from all 4 sources for triangulated analysis
 * This is the main endpoint used by the analysis system
 */
searchRouter.post('/triangulate', async (req, res) => {
  try {
    const { projectId, query, topK = 3, format = 'structured' } = req.body;

    // Validate required fields
    if (!projectId || !query) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: projectId, query'
      });
    }

    console.log(`[API] Triangulated search: "${query.substring(0, 30)}..."`);

    const context = await retrieveTriangulatedContext(projectId, query, topK);

    // Return formatted for LLM or structured JSON
    if (format === 'llm') {
      const formattedContext = formatContextForLLM(context);
      res.json({
        success: true,
        data: {
          formatted: formattedContext,
          counts: {
            framework: context.framework_data.length,
            context: context.context_data.length,
            project: context.project_data.length,
            sentiment: context.sentiment_data.length
          }
        }
      });
    } else {
      res.json({
        success: true,
        data: context
      });
    }
  } catch (error: any) {
    console.error('[API] Triangulated search error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Search failed'
    });
  }
});
