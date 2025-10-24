import { useMutation } from '@tanstack/react-query';
import { createUser } from '../api/userApi.ts';

export function useCreateUser() {
    return useMutation({ mutationFn: createUser });
}
