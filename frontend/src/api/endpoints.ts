// API v1 Endpoints
export const ENDPOINTS = {
    HELLO: {
        GET: '/api/v1/hello',
    },
    USERS: {
        CREATE: '/api/v1/users',
        GET_BY_ID: (userId: string) => `/api/v1/users/${userId}`,
    },
};
