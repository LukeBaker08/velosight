import { Router } from 'express';
import { processDocument, deleteDocument } from '../services/processing.js';

export const documentsRouter = Router();

/**
 * POST /api/documents/project/upload
 * Process and vectorize a project document
 */
documentsRouter.post('/project/upload', async (req, res) => {
  try {
    const { projectId, documentId, category, type, name, file_path } = req.body;

    // Validate required fields
    if (!projectId || !documentId || !category || !type || !name || !file_path) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: projectId, documentId, category, type, name, file_path'
      });
    }

    // Validate category (project documents only)
    if (!['project', 'context', 'sentiment'].includes(category)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category. Must be: project, context, or sentiment'
      });
    }

    console.log(`[API] Processing document: ${name} (${category})`);

    const result = await processDocument({
      projectId,
      documentId,
      category: category as "project" | "context" | "sentiment",
      type,
      name,
      filePath: file_path
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[API] Document processing error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Document processing failed'
    });
  }
});

/**
 * POST /api/documents/framework/upload
 * Process and vectorize a framework document
 */
documentsRouter.post('/framework/upload', async (req, res) => {
  try {
    const { documentId, type, name, file_path } = req.body;

    // Validate required fields
    if (!documentId || !type || !name || !file_path) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: documentId, type, name, file_path'
      });
    }

    console.log(`[API] Processing framework material: ${name}`);

    const result = await processDocument({
      projectId: '',  // Framework materials are global (no project association)
      documentId,
      category: 'framework',
      type,
      name,
      filePath: file_path
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[API] Framework material processing error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Framework material processing failed'
    });
  }
});

/**
 * DELETE /api/documents/project/delete
 * Delete a document and its vectors from the index
 */
documentsRouter.delete('/project/delete', async (req, res) => {
  try {
    const { document_id } = req.body;

    if (!document_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: document_id'
      });
    }

    console.log(`[API] Deleting document: ${document_id}`);

    const result = await deleteDocument(document_id);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('[API] Document deletion error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Document deletion failed'
    });
  }
});

/**
 * DELETE /api/documents/framework/delete
 * Delete a framework document and its vectors
 */
documentsRouter.delete('/framework/delete', async (req, res) => {
  try {
    const { document_id } = req.body;

    if (!document_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: document_id'
      });
    }

    console.log(`[API] Deleting framework material: ${document_id}`);

    const result = await deleteDocument(document_id);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('[API] Framework material deletion error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Framework material deletion failed'
    });
  }
});
