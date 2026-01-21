import { NextResponse } from 'next/server';

/**
 * Create a standardized API error response
 *
 * @param {string} message - The error message to display to the user
 * @param {number} status - HTTP status code (default: 500)
 * @param {any} details - Additional error details (only shown in development)
 * @returns {NextResponse} NextResponse with standardized error format
 *
 * @example
 * // Simple error
 * return apiError('User not found', 404);
 *
 * @example
 * // With details in development
 * return apiError('Database error', 500, { table: 'users', constraint: 'unique_email' });
 *
 * @example
 * // From caught exception
 * catch (error) {
 *   return apiErrorFromException('Failed to generate letter', error);
 * }
 */
export function apiError(message, status = 500, details) {
    const response = {
        error: message,
    };

    // Include details only in development mode
    if (process.env.NODE_ENV === 'development' && details !== undefined) {
        response.details = details;
    }

    return NextResponse.json(response, { status });
}

/**
 * Create an API error response from an exception
 *
 * @param {string} userMessage - User-friendly error message
 * @param {any} exception - The caught exception
 * @param {number} status - HTTP status code (default: 500)
 * @returns {NextResponse} NextResponse with standardized error format
 *
 * @example
 * catch (error) {
 *   return apiErrorFromException('Failed to generate letter', error);
 * }
 */
export function apiErrorFromException(userMessage, exception, status = 500) {
    console.error(userMessage, exception);

    const response = {
        error: userMessage,
    };

    // In development, include exception details
    if (process.env.NODE_ENV === 'development') {
        response.details = exception.stack || exception.toString();
        response.type = exception.constructor?.name;
    }

    return NextResponse.json(response, { status });
}

/**
 * Common HTTP error responses
 */
export const ApiErrors = {
    /**
     * 400 Bad Request
     */
    badRequest: (message = 'Bad request', details) =>
        apiError(message, 400, details),

    /**
     * 401 Unauthorized
     */
    unauthorized: (message = 'Unauthorized. Please sign in.') =>
        apiError(message, 401),

    /**
     * 403 Forbidden
     */
    forbidden: (message = 'Forbidden. You do not have permission to access this resource.') =>
        apiError(message, 403),

    /**
     * 404 Not Found
     */
    notFound: (message = 'Resource not found') =>
        apiError(message, 404),

    /**
     * 409 Conflict
     */
    conflict: (message = 'Conflict. Resource already exists.') =>
        apiError(message, 409),

    /**
     * 429 Too Many Requests
     */
    tooManyRequests: (message = 'Too many requests. Please try again later.', retryAfter = 60) =>
        NextResponse.json(
            { error: message },
            {
                status: 429,
                headers: {
                    'Retry-After': retryAfter.toString(),
                },
            }
        ),

    /**
     * 500 Internal Server Error
     */
    internalError: (message = 'Internal server error. Please try again.', details) =>
        apiError(message, 500, details),

    /**
     * 503 Service Unavailable
     */
    serviceUnavailable: (message = 'Service temporarily unavailable. Please try again later.') =>
        apiError(message, 503),
};
