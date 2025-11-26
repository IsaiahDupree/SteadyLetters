/**
 * API Configuration
 * 
 * This file centralizes API endpoint configuration.
 * In development, the backend runs on port 3001.
 * In production, update BACKEND_URL to your backend deployment URL.
 */

export const API_BASE_URL = 
    process.env.NEXT_PUBLIC_BACKEND_URL || 
    process.env.NEXT_PUBLIC_API_URL || 
    'http://localhost:3001';

/**
 * Get the full API URL for an endpoint
 */
export function getApiUrl(endpoint: string): string {
    // Remove leading slash if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    
    // Ensure endpoint starts with /api
    const apiEndpoint = cleanEndpoint.startsWith('api/') 
        ? `/${cleanEndpoint}` 
        : `/api/${cleanEndpoint}`;
    
    return `${API_BASE_URL}${apiEndpoint}`;
}

/**
 * Make an authenticated API request
 */
export async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = getApiUrl(endpoint);
    
    const response = await fetch(url, {
        ...options,
        credentials: 'include', // Include cookies for authentication
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `API request failed: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Make an authenticated API request with FormData (for file uploads)
 */
export async function apiRequestFormData<T>(
    endpoint: string,
    formData: FormData,
    options: RequestInit = {}
): Promise<T> {
    const url = getApiUrl(endpoint);
    
    const response = await fetch(url, {
        ...options,
        method: options.method || 'POST',
        body: formData,
        credentials: 'include', // Include cookies for authentication
        // Don't set Content-Type header - browser will set it with boundary
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `API request failed: ${response.statusText}`);
    }

    return response.json();
}
