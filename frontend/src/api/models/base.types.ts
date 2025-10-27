import type { components } from '../../../schema';

export type AppResponse<T> = {
    success: boolean;
    data?: T;
    message?: string;
    meta?: components['schemas']['Meta'];
    error?: components['schemas']['ErrorInfo'];
    trace_id?: string | null;
};

export type ValidationError = components['schemas']['ValidationError'];
