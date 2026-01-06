export interface ApiResponse<T> {
    statusCode: number;
    message: string;
    data?: T;
    timestamp: string;
    traceId: string; // Critical for tracking errors across logs
    path: string;
}