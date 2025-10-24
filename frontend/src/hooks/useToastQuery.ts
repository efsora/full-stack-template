import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import type { AppResponse } from '../api/models.ts';

function useToast<T>(
    data: AppResponse<T> | undefined,
    isLoading: boolean,
    isSuccess: boolean,
    isError: boolean,
    error: Error | null,
) {
    const toastId = useRef<string | null>(null);
    useEffect(() => {
        if (isLoading) {
            toastId.current = toast.loading('Loading...');
        }
        if (isSuccess) {
            if (toastId.current) {
                toast.dismiss(toastId.current);
            }
            if (data?.success) {
                toast.success(data?.message || 'Success');
            } else {
                data?.error?.errors?.forEach((m) =>
                    toast.error(m.field + ': ' + m.reason),
                );
            }
        }
        if (isError) {
            if (toastId.current) {
                toast.dismiss(toastId.current);
            }
            toast.error(error?.message || 'Something went wrong');
        }
    }, [toastId, data, isLoading, isSuccess, isError, error]);
}

export function useToastQuery<T>(q: UseQueryResult<AppResponse<T>>) {
    useToast(q.data, q.isLoading, q.isSuccess, q.isError, q.error);
    return q;
}

export function useToastMutation<T, V = unknown>(
    m: UseMutationResult<AppResponse<T>, Error, V>,
) {
    useToast(m.data, m.isPending, m.isSuccess, m.isError, m.error);
    return m;
}
