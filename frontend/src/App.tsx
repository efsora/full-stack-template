import './App.css';
import ErrorBoundary from './presentation/view/wrappers/ErrorBoundary.tsx';
import {
    type QueryCacheNotifyEvent,
    QueryClient,
    QueryClientProvider,
} from '@tanstack/react-query';
import Router from './presentation/view/wrappers/Router.tsx';
import { NotificationProvider } from './presentation/components/NotificationProvider.tsx';
import { notifyResponse } from './notify/notifyResponse.ts';
import { useEffect } from 'react';

const queryClient = new QueryClient();

function useQueryCacheSubscription(queryClient: QueryClient) {
    useEffect(() => {
        const unsubscribe = queryClient
            .getQueryCache()
            .subscribe((event: QueryCacheNotifyEvent) => {
                if (
                    event?.type === 'updated' &&
                    event.action?.type === 'success' &&
                    event.query?.meta?.showToast &&
                    event.query.state.data
                ) {
                    notifyResponse(event.query.state.data);
                }
            });

        return () => {
            unsubscribe();
        };
    }, [queryClient]);
}

function App() {
    useQueryCacheSubscription(queryClient);
    return (
        <>
            <QueryClientProvider client={queryClient}>
                <ErrorBoundary>
                    <NotificationProvider />
                    <Router />
                </ErrorBoundary>
            </QueryClientProvider>
        </>
    );
}

export default App;
// Test comment for git hook
