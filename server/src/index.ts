import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { documentsRouter } from './routes/documents.js';
import { searchRouter } from './routes/search.js';
import { analysisRouter } from './routes/analysis.js';
import { requireAuth } from './middleware/auth.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Debug: Check if env vars are loaded
console.log('Environment variables loaded:');
console.log('- VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? 'SET' : 'MISSING');
console.log('- VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'MISSING');
console.log('- AZURE_OPENAI_ENDPOINT:', process.env.AZURE_OPENAI_ENDPOINT ? 'SET' : 'MISSING');
console.log('- AZURE_OPENAI_DEPLOYMENT_GPT4O:', process.env.AZURE_OPENAI_DEPLOYMENT_GPT4O || 'MISSING');
console.log('- AZURE_OPENAI_DEPLOYMENT_EMBEDDING:', process.env.AZURE_OPENAI_DEPLOYMENT_EMBEDDING || 'MISSING');
console.log('- AZURE_SEARCH_ENDPOINT:', process.env.AZURE_SEARCH_ENDPOINT ? 'SET' : 'MISSING');

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// CORS Configuration
// Development origins + production URLs
const allowedOrigins = [
  // Development
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:3000',
  // Production
  'https://velosight.fidere.au',
  // Dynamic from environment (for staging, etc.)
  process.env.FRONTEND_URL
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Health check (no auth required)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'VeloSight Document Processing API' });
});

// Protected routes - require Supabase JWT authentication
app.use('/api/documents', requireAuth, documentsRouter);
app.use('/api/search', requireAuth, searchRouter);
app.use('/api/analysis', requireAuth, analysisRouter);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: err.message || 'Internal server error',
    success: false
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📝 Document processing: http://localhost:${PORT}/api/documents`);
  console.log(`🔍 RAG Search:          http://localhost:${PORT}/api/search`);
  console.log(`🧠 Analysis:            http://localhost:${PORT}/api/analysis`);
});
