import './App.css';
import ErrorBoundary from './presentation/view/wrappers/ErrorBoundary.tsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Router from './presentation/view/wrappers/Router.tsx';
import { NotificationProvider } from './presentation/components/NotificationProvider.tsx';

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
