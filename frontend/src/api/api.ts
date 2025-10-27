import type { AxiosError, AxiosResponse } from 'axios';

import { axios } from './axios';

export const get = async <T>(
    location: string,
    params: Record<string, unknown> = {},
): Promise<AxiosResponse<T>> => {
    try {
        const response = await axios.get<T>(location, { params });
        return response;
    } catch (error) {
        const axiosError = error as AxiosError<T>;
        return axiosError.response as AxiosResponse<T>;
    }
};

export const post = async <T, R>(
    location: string,
    body: R,
    params: Record<string, unknown> = {},
): Promise<AxiosResponse<T>> => {
    try {
        const response = await axios.post<T>(location, body, { params });
        return response;
    } catch (error) {
        const axiosError = error as AxiosError<T>;
        return axiosError.response as AxiosResponse<T>;
    }
};
