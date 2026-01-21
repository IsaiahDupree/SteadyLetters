/**
 * Structured logging utility for SteadyLetters
 * Outputs JSON-formatted logs for better parsing in production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
    name?: string;
  };
}

function formatLogEntry(
  level: LogLevel,
  message: string,
  context?: Record<string, any>,
  error?: Error
): LogEntry {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
  };

  if (context && Object.keys(context).length > 0) {
    entry.context = context;
  }

  if (error) {
    entry.error = {
      message: error.message,
      name: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    };
  }

  return entry;
}

function log(
  level: LogLevel,
  message: string,
  context?: Record<string, any>,
  error?: Error
): void {
  const entry = formatLogEntry(level, message, context, error);

  // Use appropriate console method based on level
  if (level === 'error') {
    console.error(JSON.stringify(entry));
  } else if (level === 'warn') {
    console.warn(JSON.stringify(entry));
  } else if (level === 'debug' && process.env.NODE_ENV === 'development') {
    console.debug(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

// Convenience methods
export const logger = {
  debug: (message: string, context?: Record<string, any>) => {
    log('debug', message, context);
  },

  info: (message: string, context?: Record<string, any>) => {
    log('info', message, context);
  },

  warn: (message: string, context?: Record<string, any>, error?: Error) => {
    log('warn', message, context, error);
  },

  error: (message: string, context?: Record<string, any>, error?: Error) => {
    log('error', message, context, error);
  },

  // Specialized logging methods
  apiRequest: (method: string, path: string, statusCode: number, duration: number) => {
    logger.info('API Request', {
      method,
      path,
      statusCode,
      duration,
      type: 'api_request',
    });
  },

  slowRequest: (method: string, path: string, duration: number) => {
    logger.warn('Slow API Request', {
      method,
      path,
      duration,
      type: 'slow_request',
    });
  },

  usageEvent: (userId: string, action: string, metadata?: Record<string, any>) => {
    logger.info('Usage Event', {
      userId,
      action,
      type: 'usage',
      ...metadata,
    });
  },

  billingEvent: (userId: string, event: string, metadata?: Record<string, any>) => {
    logger.info('Billing Event', {
      userId,
      event,
      type: 'billing',
      ...metadata,
    });
  },
};

export default logger;
