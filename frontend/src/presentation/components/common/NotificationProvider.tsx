'use client';
import { Toaster } from 'react-hot-toast';

export const NotificationProvider = () => {
    return (
        <Toaster
            position="top-right"
            toastOptions={{
                className: 'bg-white text-gray-900 shadow-lg rounded-xl',
                duration: 3000,
                success: {
                    className: 'bg-green-500 text-white',
                },
                error: {
                    className: 'bg-red-500 text-white',
                },
            }}
        />
    );
};
