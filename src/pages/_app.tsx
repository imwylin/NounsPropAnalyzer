import type { AppProps } from 'next/app'
import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HydrationBoundary } from '@tanstack/react-query'
import { PriceProvider } from '../features/treasury/context/PriceContext'
import '../core/styles/globals.css'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 15000, // 15 seconds - matches our sync interval
      retry: 3,
    },
  },
})

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    let mounted = true;

    // Start background sync
    const startSync = async () => {
      if (!mounted) return;
      
      try {
        console.log('Starting background sync process...');
        const response = await fetch('/api/treasury/sync/scheduler', { 
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to start background sync');
        }
        
        const result = await response.json();
        if (mounted) {
          console.log('Background sync started:', result);
        }
      } catch (error) {
        if (mounted) {
          console.error('Failed to start background sync:', error);
        }
      }
    };

    // Only start sync in production or if explicitly enabled
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_DEV_SYNC === 'true') {
      startSync();
    }

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={pageProps.dehydratedState}>
        <PriceProvider>
          <Component {...pageProps} />
        </PriceProvider>
      </HydrationBoundary>
    </QueryClientProvider>
  )
} 