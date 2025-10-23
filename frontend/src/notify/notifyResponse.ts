import toast from 'react-hot-toast';

type NotificationData = {
    success?: boolean;
    message?: string;
    error?: string | { message: string };
};

export function notifyResponse(data: NotificationData) {
    if (data?.success === true) {
        toast.success(data?.message ?? 'Success');
    } else {
        const message =
            typeof data?.error === 'string'
                ? data.error
                : data?.error?.message || 'An error occurred';
        toast.error(String(message));
    }
}
