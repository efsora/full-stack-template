import * as api from '#api/api';
import { ENDPOINTS } from '#api/endpoints';

import type { CreateUserRequest } from '../types/user/request.types';
import type { AppResponse_CreateUserResponse_ } from '../types/user/response.types';

export const createUser = async (
    createUserRequest: CreateUserRequest,
): Promise<AppResponse_CreateUserResponse_> => {
    const response = await api.post<
        AppResponse_CreateUserResponse_,
        CreateUserRequest
    >(ENDPOINTS.USERS.CREATE, createUserRequest);

    return response?.data;
};

export const getUserById = async (
    userId: number,
): Promise<AppResponse_CreateUserResponse_> => {
    const response = await api.get<AppResponse_CreateUserResponse_>(
        ENDPOINTS.USERS.GET_BY_ID(userId),
    );

    return response?.data;
};
