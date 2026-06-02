/**
 * Structured logging utility for backend and frontend
 * Captures: API requests, responses, errors, form submissions, auth events
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  requestId?: string;
  userId?: string;
  context?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

import { Sentry } from '@/lib/sentry'

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  /**
   * Format and output log entry
   */
  private formatLog(entry: LogEntry): string {
    const { timestamp, level, message, requestId, userId, context, error } = entry;
    
    let log = `[${timestamp}] [${level.toUpperCase()}]`;
    if (requestId) log += ` [${requestId}]`;
    if (userId) log += ` [User: ${userId}]`;
    log += ` ${message}`;
    
    if (context && Object.keys(context).length > 0) {
      log += ` ${JSON.stringify(context, null, 2)}`;
    }
    
    if (error) {
      log += `\nError: ${error.message}`;
      if (error.code) log += ` (Code: ${error.code})`;
      if (error.stack) log += `\nStack: ${error.stack}`;
    }
    
    return log;
  }

  /**
   * Redact sensitive fields from context
   */
  private redactSensitive(context: Record<string, any>): Record<string, any> {
    const sensitiveKeys = ['password', 'hashedpassword', 'token', 'secret', 'privatekey', 'mnemonic', 'encryptedprivatekey', 'encryptedmnemonic', 'authorization']
    return JSON.parse(JSON.stringify(context, (key, value) => {
      if (sensitiveKeys.includes(key.toLowerCase())) return '[REDACTED]'
      return value
    }))
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, options?: {
    requestId?: string;
    userId?: string;
    context?: Record<string, any>;
    error?: Error | any;
  }) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      requestId: options?.requestId,
      userId: options?.userId,
      context: options?.context ? this.redactSensitive(options.context) : undefined,
    };

    if (options?.error) {
      entry.error = {
        message: options.error.message || String(options.error),
        stack: options.error.stack,
        code: options.error.code,
      };
    }

    const formatted = this.formatLog(entry);

    // Output based on level (only in development)
    if (this.isDevelopment) {
      switch (level) {
        case 'debug':
          console.debug(formatted);
          break;
        case 'info':
          console.log(formatted);
          break;
        case 'warn':
          console.warn(formatted);
          break;
        case 'error':
          console.error(formatted);
          break;
      }
    }

    // Send errors to Sentry in production
    if (level === 'error' && process.env.NODE_ENV === 'production' && options?.error) {
      Sentry.captureException(options.error, {
        extra: {
          message,
          requestId: options.requestId,
          userId: options.userId,
          context: options.context,
        },
      })
    }

    return entry;
  }

  debug(message: string, options?: Parameters<typeof this.log>[2]) {
    return this.log('debug', message, options);
  }

  info(message: string, options?: Parameters<typeof this.log>[2]) {
    return this.log('info', message, options);
  }

  warn(message: string, options?: Parameters<typeof this.log>[2]) {
    return this.log('warn', message, options);
  }

  error(message: string, options?: Parameters<typeof this.log>[2]) {
    return this.log('error', message, options);
  }
}

export const logger = new Logger();

/**
 * Frontend-specific data tracker
 */
export const dataTracker = {
  /**
   * Log form submission
   */
  trackFormSubmission(formName: string, data: Record<string, any>, userId?: string) {
    const sanitized = { ...data };
    // Remove sensitive fields
    delete sanitized.password;
    delete sanitized.confirmPassword;
    delete sanitized.cardNumber;
    delete sanitized.cvv;

    logger.info(`Form submitted: ${formName}`, {
      userId,
      context: {
        form: formName,
        fields: Object.keys(sanitized),
        data: sanitized,
      },
    });
  },

  /**
   * Log API call (frontend)
   */
  trackApiFetch(
    method: string,
    url: string,
    status: number,
    duration: number,
    userId?: string,
    error?: any
  ) {
    const level = status >= 400 ? 'error' : 'info';
    logger[level](`API ${method} ${url}`, {
      userId,
      context: {
        method,
        url,
        status,
        duration: `${duration}ms`,
      },
      error: error,
    });
  },

  /**
   * Log auth event
   */
  trackAuthEvent(event: string, userId: string, details?: Record<string, any>) {
    logger.info(`Auth event: ${event}`, {
      userId,
      context: {
        event,
        ...details,
      },
    });
  },

  /**
   * Log component state change
   */
  trackStateChange(
    component: string,
    stateKey: string,
    oldValue: any,
    newValue: any,
    userId?: string
  ) {
    logger.debug(`State change in ${component}`, {
      userId,
      context: {
        component,
        stateKey,
        changed: oldValue !== newValue,
        newValue,
      },
    });
  },

  /**
   * Log financial transaction
   */
  trackTransaction(
    type: 'payment' | 'transfer' | 'topup',
    userId: string,
    details: {
      amount: number;
      currency: string;
      recipient?: string;
      status: 'initiated' | 'completed' | 'failed';
      transactionId?: string;
      error?: string;
    }
  ) {
    const level = details.status === 'failed' ? 'error' : 'info';
    logger[level](`Transaction: ${type}`, {
      userId,
      context: {
        transactionType: type,
        amount: details.amount,
        currency: details.currency,
        recipient: details.recipient,
        status: details.status,
        transactionId: details.transactionId,
        error: details.error,
      },
    });
  },
};
