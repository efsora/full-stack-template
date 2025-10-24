import { axios } from './axios';
import type { AxiosResponse } from 'axios';

export const get = async <T>(
    location: string,
    params = {},
): Promise<AxiosResponse<T>> => {
    return axios
        .get(location, { params })
        .then((response) => response)
        .catch((error) => error.response);
};

export const post = async <T, R>(
    location: string,
    body: R,
    params = {},
): Promise<AxiosResponse<T>> => {
    return axios
        .post(location, body, { params })
        .then((response) => response)
        .catch((error) => error.response);
};
