import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler.js';
import uploadRoutes from './routes/upload.routes.js';
import templateRoutes from './routes/template.routes.js';
import categoryRoutes from './routes/category.routes.js';
import creativeRoutes from './routes/creative.routes.js';
import userRoutes from './routes/user.routes.js';
import adminRoutes from './routes/admin.routes.js';
import trendingRoutes from './routes/trending.routes.js';
import metricsRoutes from './routes/metrics.routes.js';
import presenceRoutes from './routes/presence.routes.js';

const app = express();

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Craft AI Backend',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/creatives', creativeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/trending', trendingRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/presence', presenceRoutes);

// Error handler middleware
app.use(errorHandler);

export default app;
