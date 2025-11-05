import * as api from '#api/api';
import { ENDPOINTS } from '#api/endpoints';

import type { AppResponse_UserData_ } from '../types/user/response.types';

export const getUserById = async (
    userId: string,
): Promise<AppResponse_UserData_> => {
    const response = await api.get<AppResponse_UserData_>(
        ENDPOINTS.USERS.GET_BY_ID(userId),
    );

    return response?.data;
};

export const getAllUsers = async (): Promise<AppResponse_UserData_> => {
    const response = await api.get<AppResponse_UserData_>(
        ENDPOINTS.USERS.GET_ALL,
    );

    return response?.data;
};
