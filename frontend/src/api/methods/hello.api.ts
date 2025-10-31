import type { AxiosResponse } from 'axios';

import * as api from '#api/api';
import { ENDPOINTS } from '#api/endpoints';

import type { AppResponse_HelloResponse_ } from '../types/hello/response.types.ts';

export const getHello = async (): Promise<AppResponse_HelloResponse_> => {
    const response = await api.get(ENDPOINTS.HELLO.GET);
    return (response as AxiosResponse<AppResponse_HelloResponse_>).data;
};
