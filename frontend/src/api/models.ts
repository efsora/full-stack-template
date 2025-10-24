import type { components } from '../../schema';

export type AppResponse<T> = {
    success: boolean;
    data?: T;
    message?: string;
    meta?: components['schemas']['Meta'];
    error?: components['schemas']['ErrorInfo'];
    trace_id?: string | null;
};

export type CreateUserResponse = components['schemas']['CreateUserResponse'];

export type CreateUserRequest = components['schemas']['CreateUserRequest'];

export type ValidationError = components['schemas']['ValidationError'];

export type HelloResponse = components['schemas']['HelloResponse'];

export type AppResponse_HelloResponse_ =
    components['schemas']['AppResponse_HelloResponse_'];

export type AppResponse_CreateUserResponse_ = AppResponse<CreateUserResponse>;

export type UserSummaryResponse_ = AppResponse<SummaryUser>;

export type SummaryUser = {
    user_name: string;
    user_surname: string;
};
