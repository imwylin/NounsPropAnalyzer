import { useState, useEffect } from 'react';
import { ContractDetails } from '../types/frontend';

interface UseContractDataReturn {
  data: ContractDetails | null;
  isLoading: boolean;
  error: Error | null;
}

export function useContractData(address: string): UseContractDataReturn {
  const [data, setData] = useState<ContractDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/treasury/contract?address=${address}`);
        if (!response.ok) {
          throw new Error('Failed to fetch contract data');
        }
        const contractData = await response.json();
        setData(contractData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [address]);

  return { data, isLoading, error };
} 