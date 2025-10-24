import axiosPackage from 'axios';
import { API_URL } from '../config/env.ts';

export const axios = axiosPackage.create({
    withCredentials: true,
    baseURL: API_URL,
});
