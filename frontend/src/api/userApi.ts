import type {
    AppResponse_CreateUserResponse_,
    CreateUserRequest,
} from './models.ts';
import * as api from './api';

export const getUserById = async (
    userId: number,
): Promise<AppResponse_CreateUserResponse_> => {
    const response = await api.get<AppResponse_CreateUserResponse_>(
        `/api/v1/users/${userId}`,
    );

    return response?.data;
};

export const createUser = async (
    createUserRequest: CreateUserRequest,
): Promise<AppResponse_CreateUserResponse_> => {
    const response = await api.post<
        AppResponse_CreateUserResponse_,
        CreateUserRequest
    >('/api/v1/users', createUserRequest);

    return response?.data;
};
