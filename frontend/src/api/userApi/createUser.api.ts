import * as api from '#api/api';

import type { CreateUserRequest } from '../models/user/request.types';
import type { AppResponse_CreateUserResponse_ } from '../models/user/response.types';

export const createUser = async (
    createUserRequest: CreateUserRequest,
): Promise<AppResponse_CreateUserResponse_> => {
    const response = await api.post<
        AppResponse_CreateUserResponse_,
        CreateUserRequest
    >('/api/v1/users', createUserRequest);

    return response?.data;
};
