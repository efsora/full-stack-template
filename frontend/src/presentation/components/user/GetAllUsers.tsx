import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useGetAllUsers } from '#api/hooks/useUser';
import { Table } from '#components/common/Table';
import type { Column } from '#components/common/Table';

interface UserRow {
    id: string;
    email: string;
    name: string | null;
    createdAt: string | null;
    updatedAt: string | null;
}

/**
 * GetAllUsers component
 * Displays all users in a reusable table format
 */
export default function GetAllUsers() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { data, error, isLoading, isError } = useGetAllUsers();

    const users: UserRow[] = data?.data
        ? Array.isArray(data.data)
            ? data.data
            : [data.data]
        : [];

    const columns: Column<UserRow>[] = [
        {
            key: 'email',
            label: 'Email',
        },
        {
            key: 'name',
            label: 'Name',
            render: (value) => value || 'N/A',
        },
        {
            key: 'createdAt',
            label: 'Created At',
            render: (value) =>
                value ? new Date(value).toLocaleDateString() : 'N/A',
        },
        {
            key: 'updatedAt',
            label: 'Updated At',
            render: (value) =>
                value ? new Date(value).toLocaleDateString() : 'N/A',
        },
    ];

    const handleRowClick = (user: UserRow) => {
        navigate(`/users/${user.id}`);
    };

    return (
        <div className="card">
            <h2 className="font-bold text-xl mb-4">{t('users') || 'Users'}</h2>
            <Table<UserRow>
                columns={columns}
                data={users}
                keyExtractor={(user) => user.id}
                onRowClick={handleRowClick}
                loading={isLoading}
                error={
                    isError ? error?.message || 'Failed to load users' : null
                }
                emptyMessage="No users found"
            />
        </div>
    );
}
