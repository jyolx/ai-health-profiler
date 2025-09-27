import winston from 'winston';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create base Winston logger configuration
const baseLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true })
  ),
  transports: [
    // Log to console with colors
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, module, ...meta }) => {
          const moduleStr = module ? `[${module}]` : '';
          let msg = `${timestamp} [${level}]${moduleStr}: ${message}`;
          if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
          }
          return msg;
        })
      )
    }),
    
    // Log to file 
    new winston.transports.File({ 
      filename: 'logs/app.log',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, module, ...meta }) => {
          const moduleStr = module ? `[${module}]` : '';
          let msg = `${timestamp} [${level}]${moduleStr}: ${message}`;
          if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
          }
          return msg;
        })
      )
    })
  ]
});

// Factory function to create module-specific loggers
function createLogger(moduleName) {
  return {
    info: (message, meta = {}) => baseLogger.info(message, { ...meta, module: moduleName }),
    warn: (message, meta = {}) => baseLogger.warn(message, { ...meta, module: moduleName }),
    error: (message, meta = {}) => baseLogger.error(message, { ...meta, module: moduleName }),
    debug: (message, meta = {}) => baseLogger.debug(message, { ...meta, module: moduleName })
  };
}

// Default logger for backward compatibility
const logger = createLogger('app');

export default logger;
export { createLogger };