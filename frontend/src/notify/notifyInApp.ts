import toast from 'react-hot-toast';

type ToastMessages = {
    loading?: string;
    success?: string;
    error?: string;
};

export const notifyInApp = {
    success: (msg: string) => toast.success(msg),
    error: (msg: string) => toast.error(msg),
    info: (msg: string) => toast(msg),
    loading: (msg: string) => toast.loading(msg),

    promise: <T>(promise: Promise<T>, msgPayload: Required<ToastMessages>) =>
        toast.promise(promise, msgPayload),

    async: async <T>(
        promise: Promise<T>,
        {
            loading = 'Processing...',
            success = 'Done!',
            error = 'Something went wrong',
        }: ToastMessages,
    ): Promise<T | undefined> => {
        try {
            return await toast.promise(promise, { loading, success, error });
        } catch (err) {
            console.error('Toast async error:', err);
            return undefined;
        }
    },
};
