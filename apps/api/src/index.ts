import express from 'express';
import cors from 'cors';
import { ENV } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authenticateJwt } from './middleware/auth.js';

import { authRouter } from './routes/authRoutes.js';
import { farmRouter } from './routes/farmRoutes.js';
import { cropRouter } from './routes/cropRoutes.js';
import { weatherRouter } from './routes/weatherRoutes.js';
import { iotRouter } from './routes/iotRoutes.js';
import { marketRouter } from './routes/marketRoutes.js';
import { knowledgeRouter } from './routes/knowledgeRoutes.js';
import { assistantRouter } from './routes/assistantRoutes.js';
import { unifiedRouter } from './routes/unifiedRoutes.js';

const app = express();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'AgriHub Core API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/farms', authenticateJwt, farmRouter);
app.use('/api/v1/crops', authenticateJwt, cropRouter);
app.use('/api/v1/weather', weatherRouter);
app.use('/api/v1/iot', iotRouter);
app.use('/api/v1/market', marketRouter);
app.use('/api/v1/knowledge', knowledgeRouter);
app.use('/api/v1/assistant', assistantRouter);
app.use('/api/v1/unified', unifiedRouter);

// Centralized Error Handler
app.use(errorHandler);

// Start Server
app.listen(ENV.PORT, () => {
  console.log(`🌾 AgriHub API Server running on port ${ENV.PORT} [${ENV.NODE_ENV}]`);
  console.log(`👉 Health check: http://localhost:${ENV.PORT}/health`);
});
