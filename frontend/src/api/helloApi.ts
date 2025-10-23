import type { AppResponse_HelloResponse_ } from './models.ts';
import { API_URL } from '../config/env.ts';

export const getHello = async ({
    signal,
}: {
    signal: AbortSignal;
}): Promise<AppResponse_HelloResponse_> => {
    const response = await fetch(`${API_URL}/api/v1/hello`, { signal });

    if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(
            errorResponse.error?.message || 'An unknown error occurred',
        );
    }

    return (await response.json()) as AppResponse_HelloResponse_;
};
