import type { components } from '../../../schema';

export type AppResponse<T> = {
    success: boolean;
    data?: T;
    message?: string;
    meta?: components['schemas']['Meta'];
    error?: components['schemas']['AppError'];
    traceId?: string;
};

export type AppError = components['schemas']['AppError'];
export type ErrorResponse = components['schemas']['ErrorResponse'];
