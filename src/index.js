import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import routes from './routes.js';
import { createLogger } from './utils/logger.js';

// Environment variables
dotenv.config();

const logger = createLogger('server');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());

// Enhanced JSON parser with error handling
app.use((req, res, next) => {
  express.json()(req, res, (err) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      logger.warn('Malformed JSON in request body', {
        error: err.message,
        body: err.body,
        url: req.url,
        method: req.method
      });
      return res.status(400).json({
        status: 'error',
        type: 'invalid_json',
        message: 'Invalid JSON format in request body. Please check your JSON syntax.'
      });
    }
    next(err);
  });
});

app.use(express.urlencoded({ extended: true }));

// logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, { 
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// API Routes
app.use('/api', routes);
logger.info('API routes mounted at /api');

// Ping check
app.get('/ping', (req, res) => {
  logger.info('Ping check requested');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Application error occurred', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });
  res.status(500).json({ 
    status: 'error', 
    message: 'Internal server error' 
  });
});

// 404 handler
app.use((req, res) => {
  logger.warn(`Route not found: ${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  res.status(404).json({ 
    status: 'error', 
    message: 'Route not found' 
  });
});

app.listen(PORT, () => {
  logger.info(`🚀 Health Risk Profiler server running on port ${PORT}`);
  logger.info(`📊 Server check available at: http://localhost:${PORT}/ping`);
  logger.info(`🔗 API endpoints available at: http://localhost:${PORT}/api`);
  logger.info(`⚙️ Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`📝 Log Level: ${process.env.LOG_LEVEL || 'info'}`);
});

export default app;