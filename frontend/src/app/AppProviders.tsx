import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { healthQueryOptions } from '../features/api-status';
import { createQueryClient } from './queryClient';

export function AppProviders({ children }: { children: ReactNode }) {
    const [queryClient] = useState(createQueryClient);
    // The page's one wake signal: the shared health check starts when the app starts, on every route, whichever
    // components render (PF-022 D1). The panel and the footer read the same query, so this sends no second request.
    useEffect(() => {
        void queryClient.prefetchQuery(healthQueryOptions);
    }, [queryClient]);
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
