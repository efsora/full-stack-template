import type { ReactNode } from 'react';

export interface Column<T> {
    key: keyof T;
    label: string;
    render?: (value: T[keyof T], row: T) => ReactNode;
}

interface TableProps<T> {
    columns: Column<T>[];
    data: T[];
    keyExtractor: (row: T, index: number) => string | number;
    onRowClick?: (row: T) => void;
    loading?: boolean;
    error?: string | null;
    emptyMessage?: string;
}

/**
 * Reusable table component
 * Displays data in a table format with customizable columns and rendering
 */
export function Table<T>({
    columns,
    data,
    keyExtractor,
    onRowClick,
    loading = false,
    error = null,
    emptyMessage = 'No data available',
}: TableProps<T>) {
    if (loading) {
        return <div className="p-4 text-center">Loading...</div>;
    }

    if (error) {
        return (
            <div className="p-4 text-center text-red-600">Error: {error}</div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="p-4 text-center text-gray-500">{emptyMessage}</div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                    <tr className="bg-gray-100">
                        {columns.map((column) => (
                            <th
                                key={String(column.key)}
                                className="border border-gray-300 px-4 py-2 text-left font-semibold"
                            >
                                {column.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, index) => (
                        <tr
                            key={keyExtractor(row, index)}
                            onClick={() => onRowClick?.(row)}
                            className={`border border-gray-300 ${
                                onRowClick
                                    ? 'cursor-pointer hover:bg-gray-50 transition-colors'
                                    : ''
                            }`}
                        >
                            {columns.map((column) => (
                                <td
                                    key={String(column.key)}
                                    className="border border-gray-300 px-4 py-2"
                                >
                                    {column.render
                                        ? column.render(row[column.key], row)
                                        : String(row[column.key] ?? '')}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
