import './App.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { NotificationProvider } from './presentation/components/common/NotificationProvider.tsx';
import ErrorBoundary from './presentation/view/wrappers/ErrorBoundary.tsx';
import Router from './presentation/view/wrappers/Router.tsx';

const queryClient = new QueryClient();
function App() {
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
