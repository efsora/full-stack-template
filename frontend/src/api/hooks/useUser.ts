import { useMutation } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { createUser, getUserById } from '#api/methods/user.api';
import { MINUTES_IN_MS } from '#config/time';
import { QUERY_KEYS } from '#constants/queryKeys';
import type { SummaryUser } from '#models/user.types';
import type { UserSummaryResponse_ } from '#models/user.types';

export function useCreateUser() {
    return useMutation({ mutationFn: createUser });
}

export function useGetUserDetailedById(userId: string) {
    return useQuery({
        queryKey: [QUERY_KEYS.USER.DETAILED],
        queryFn: async () => getUserById(userId),
        staleTime: MINUTES_IN_MS * 5,
        retry: 2,
    });
}

export function useGetUserSummaryById(userId: string) {
    return useQuery({
        queryKey: [QUERY_KEYS.USER.SUMMARY],
        queryFn: async () => {
            const response = await getUserById(userId);
            return {
                ...response,
                data: response.data as SummaryUser,
            } as UserSummaryResponse_;
        },
        staleTime: MINUTES_IN_MS * 5,
        retry: 2,
    });
}
