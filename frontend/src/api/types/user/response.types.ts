import type { components } from '../../../../schema';
import type { AppResponse } from '../base.types';

export type CreateUserResponse = components['schemas']['CreateUserResponse'];
export type UserData = components['schemas']['UserData'];

export type AppResponse_CreateUserResponse_ = AppResponse<CreateUserResponse>;
export type AppResponse_UserData_ = AppResponse<UserData>;
