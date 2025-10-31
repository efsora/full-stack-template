import { useQuery } from '@tanstack/react-query';

import { getHello } from '#api/methods/hello.api';
import { MINUTES_IN_MS } from '#config/time';
import { QUERY_KEYS } from '#constants/queryKeys';

export function useGetHello() {
    return useQuery({
        queryKey: [QUERY_KEYS.HELLO],
        queryFn: getHello,
        staleTime: MINUTES_IN_MS * 5,
        retry: 2,
    });
}
