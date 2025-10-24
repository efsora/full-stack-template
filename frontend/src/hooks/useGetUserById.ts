import { useQuery } from '@tanstack/react-query';
import type { SummaryUser, UserSummaryResponse_ } from '../api/models.ts';
import { getUserById } from '../api/userApi.ts';
import QUERY_KEYS from '../config/queryKeys.ts';
import { FIVE_MINUTES_IN_MS } from '../config/constants.ts';

export function useGetUserDetailedById(userId: number) {
    return useQuery({
        queryKey: [QUERY_KEYS.USER.DETAILED],
        queryFn: async () => getUserById(userId),
        staleTime: FIVE_MINUTES_IN_MS,
        retry: 2,
    });
}

export function useGetUserSummaryById(userId: number) {
    return useQuery({
        queryKey: [QUERY_KEYS.USER.SUMMARY],
        queryFn: async () => {
            const response = await getUserById(userId);
            return {
                ...response,
                data: response.data as SummaryUser,
            } as UserSummaryResponse_;
        },
        staleTime: FIVE_MINUTES_IN_MS,
        retry: 2,
    });
}
