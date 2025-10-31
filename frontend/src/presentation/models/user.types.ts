import type { AppResponse } from '#api/types/base.types';

export type SummaryUser = {
    user_name: string;
    user_surname: string;
};

export type UserSummaryResponse_ = AppResponse<SummaryUser>;
