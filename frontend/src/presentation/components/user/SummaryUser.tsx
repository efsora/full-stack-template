import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useGetUserSummaryById } from '#hooks/useUser';

export default function SummaryUser() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const {
        data: detailedUser,
        error,
        isLoading,
        isError,
    } = useGetUserSummaryById(1);

    const handleClick = async () => {
        navigate(`/users/${1}`);
    };

    if (isLoading) return <p>Loading...</p>;
    if (isError) return <p>Error: {error?.message}</p>;

    return (
        <>
            <div className="card">
                <p className="font-bold text-xl mb-2">{t('user-summary')}</p>
                <p>Name: {detailedUser?.data?.user_name}</p>
                <p>Surname: {detailedUser?.data?.user_surname}</p>
                <button onClick={handleClick}>See details</button>
            </div>
        </>
    );
}
