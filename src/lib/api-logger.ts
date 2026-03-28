/**
 * API Request/Response logging middleware
 * Capture all API payloads, timing, and errors
 */

import { NextRequest } from 'next/server';
import { logger } from './logger';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth-options';

/**
 * Generate unique request ID for tracing
 */
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sanitize request body (remove sensitive fields)
 */
function sanitizeData(data: any): any {
  if (!data || typeof data !== 'object') return data;

  const sanitized = { ...data };
  const sensitiveFields = ['password', 'confirmPassword', 'cardNumber', 'cvv', 'pin', 'token'];

  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
}

/**
 * Extract request context
 */
async function getRequestContext(request: NextRequest) {
  let body: any = null;
  let session: any = null;

  try {
    // Try to parse body
    const clonedRequest = request.clone();
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      body = await clonedRequest.json().catch(() => null);
    }
  } catch (e) {
    body = null;
  }

  try {
    // Try to get session
    session = await getServerSession(authOptions);
  } catch (e) {
    session = null;
  }

  return {
    body: sanitizeData(body),
    userId: session?.user?.id,
    session: session?.user ? {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    } : null,
  };
}

/**
 * Main logging middleware wrapper
 * Should be called at the start of each API route
 */
export async function logApiRequest(
  request: NextRequest,
  routeName: string
) {
  const requestId = generateRequestId();
  const startTime = Date.now();
  const context = await getRequestContext(request);

  logger.info(`API Request: ${request.method} ${routeName}`, {
    requestId,
    userId: context.userId,
    context: {
      method: request.method,
      path: routeName,
      query: request.url.split('?')[1] || '',
      body: request.method !== 'GET' ? context.body : undefined,
      ip: request.headers.get('x-forwarded-for') || 'unknown',
    },
  });

  return {
    requestId,
    userId: context.userId,
    startTime,
    logResponse: (
      statusCode: number,
      data?: any,
      error?: any
    ) => {
      const duration = Date.now() - startTime;
      const level = statusCode >= 400 ? 'error' : 'info';

      logger[level](`API Response: ${request.method} ${routeName}`, {
        requestId,
        userId: context.userId,
        context: {
          method: request.method,
          path: routeName,
          statusCode,
          duration: `${duration}ms`,
          response: data ? sanitizeData(data) : undefined,
          error: error?.message,
        },
        error: error,
      });

      return { statusCode, duration, requestId };
    },
  };
}

/**
 * Express-style middleware for logging (for use in handler functions)
 */
export function createApiLogger() {
  return {
    async createForRequest(request: NextRequest, routeName: string) {
      return logApiRequest(request, routeName);
    },
  };
}
