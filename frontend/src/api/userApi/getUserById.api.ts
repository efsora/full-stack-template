import * as api from '#api/api';

import type { AppResponse_CreateUserResponse_ } from '../models/user/response.types';

export const getUserById = async (
    userId: number,
): Promise<AppResponse_CreateUserResponse_> => {
    const response = await api.get<AppResponse_CreateUserResponse_>(
        `/api/v1/users/${userId}`,
    );

    return response?.data;
};
