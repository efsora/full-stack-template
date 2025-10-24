import { useTranslation } from 'react-i18next';
import { useGetUserDetailedById } from '../../hooks/useGetUserById.ts';

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
    } = useGetUserDetailedById(Number(id));

    if (isLoading) return <p>Loading...</p>;
    if (isError) return <p>Error: {error?.message}</p>;

    return (
        <>
            <div className="card">
                <p className="font-bold text-xl mb-2">{t('user-details')}</p>
                <p>Name: {detailedUser?.data?.user_name}</p>
                <p>Surname: {detailedUser?.data?.user_surname}</p>
                <p>Email: {detailedUser?.data?.email}</p>
            </div>
        </>
    );
}
