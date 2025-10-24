import { useTranslation } from 'react-i18next';
import { useGetHello } from '../../hooks/useGetHello';

export function ResponseList() {
    const { t } = useTranslation();

    const { data: hello, isLoading, isError, error } = useGetHello();

    if (isLoading) return <p>Loading...</p>;
    if (isError) return <p>Error: {error?.message}</p>;

    return (
        <div>
            <h1>{t('response-list')}</h1>
            <p>{hello?.data?.message}</p>
        </div>
    );
}

export default ResponseList;
