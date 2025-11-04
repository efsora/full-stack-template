import { useTranslation } from 'react-i18next';

import { useGetUserDetailedById } from '#hooks/useUser';

interface DetailedUserProps {
    id: string;
}

export default function DetailedUser({ id }: DetailedUserProps) {
    const { t } = useTranslation();
    const {
        data: detailedUser,
        error,
        isLoading,
        isError,
    } = useGetUserDetailedById(id);

    if (isLoading) return <p>Loading...</p>;
    if (isError) return <p>Error: {error?.message}</p>;

    return (
        <>
            <div className="card">
                <p className="font-bold text-xl mb-2">{t('user-details')}</p>
                <p>Name: {detailedUser?.data?.name}</p>
                <p>Email: {detailedUser?.data?.email}</p>
                <p>ID: {detailedUser?.data?.id}</p>
                <p>Created: {detailedUser?.data?.createdAt}</p>
            </div>
        </>
    );
}
