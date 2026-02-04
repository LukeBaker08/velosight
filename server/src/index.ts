import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { documentsRouter } from './routes/documents.js';
import { searchRouter } from './routes/search.js';
import { analysisRouter } from './routes/analysis.js';

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

// Middleware - Allow requests from common dev ports
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'VeloSight Document Processing API' });
});

// Routes
app.use('/api/documents', documentsRouter);
app.use('/api/search', searchRouter);
app.use('/api/analysis', analysisRouter);

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
