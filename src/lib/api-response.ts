// src/lib/api-response.ts
// Utility for standardized API responses

export function apiSuccess(data: any = null, message: string = 'Success') {
  return {
    success: true,
    data,
    message,
  }
}

export function apiError(error: string, status: number = 400, data: any = null) {
  return {
    success: false,
    error,
    data,
    status,
  }
}
