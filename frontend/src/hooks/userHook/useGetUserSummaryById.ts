import { useQuery } from '@tanstack/react-query';

import type { SummaryUser } from '#api/models/user/custom.types';
import type { UserSummaryResponse_ } from '#api/models/user/response.types';
import { getUserById } from '#api/userApi/getUserById.api';
import { MINUTES_IN_MS } from '#config/constants';
import QUERY_KEYS from '#config/queryKeys';

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
        staleTime: MINUTES_IN_MS * 5,
        retry: 2,
    });
}
