import type { components } from '../../../../schema';
import type { AppResponse } from '../base.types';
import type { SummaryUser } from './custom.types';

export type CreateUserResponse = components['schemas']['CreateUserResponse'];

export type AppResponse_CreateUserResponse_ = AppResponse<CreateUserResponse>;

export type UserSummaryResponse_ = AppResponse<SummaryUser>;
