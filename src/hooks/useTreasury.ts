import { useState, useEffect } from 'react';

interface TreasuryData {
  // Define your treasury data type here
}

export function useTreasury() {
  const [data, setData] = useState<TreasuryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchTreasury() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/treasury');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const treasuryData = await response.json();
        setData(treasuryData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch treasury data'));
      } finally {
        setIsLoading(false);
      }
    }

    fetchTreasury();
  }, []);

  return { data, isLoading, error };
} 