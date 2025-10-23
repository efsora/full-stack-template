import { useQuery } from '@tanstack/react-query';
import type { AppResponse_HelloResponse_ } from '../api/models.ts';
import { getHello } from '../api/helloApi.ts';

interface UseGetHelloOptions {
    showToast?: boolean;
}

export function useGetHello({ showToast = false }: UseGetHelloOptions) {
    return useQuery<AppResponse_HelloResponse_, Error>({
        queryKey: ['hello'],
        queryFn: getHello,
        staleTime: 1000 * 60 * 5,
        retry: 2,
        meta: {
            showToast: showToast,
        },
    });
}
