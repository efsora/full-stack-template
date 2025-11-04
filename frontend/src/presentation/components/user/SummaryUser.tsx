import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useGetUserSummaryById } from '#hooks/useUser';

export default function SummaryUser() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const userId = '550e8400-e29b-41d4-a716-446655440000'; // TODO: Get from props or context
    const {
        data: detailedUser,
        error,
        isLoading,
        isError,
    } = useGetUserSummaryById(userId);

    const handleClick = async () => {
        navigate(`/users/${userId}`);
    };

    if (isLoading) return <p>Loading...</p>;
    if (isError) return <p>Error: {error?.message}</p>;

    return (
        <>
            <div className="card">
                <p className="font-bold text-xl mb-2">{t('user-summary')}</p>
                <p>Name: {detailedUser?.data?.name}</p>
                <p>Email: {detailedUser?.data?.email}</p>
                <button onClick={handleClick}>See details</button>
            </div>
        </>
    );
}
