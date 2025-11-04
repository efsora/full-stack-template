import type { AppResponse } from '#api/types/base.types';
import type { UserData } from '#api/types/user/response.types';

export type SummaryUser = {
    id: string;
    email: string;
    name: string | null;
};

export type UserSummaryResponse_ = AppResponse<SummaryUser>;

// Re-export UserData for convenience
export type { UserData };
