import { useQuery } from '@tanstack/react-query';

import { getUserById } from '#api/userApi/getUserById.api';
import { MINUTES_IN_MS } from '#config/constants';
import QUERY_KEYS from '#config/queryKeys';

export function useGetUserDetailedById(userId: number) {
    return useQuery({
        queryKey: [QUERY_KEYS.USER.DETAILED],
        queryFn: async () => getUserById(userId),
        staleTime: MINUTES_IN_MS * 5,
        retry: 2,
    });
}
