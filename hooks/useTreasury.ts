import { useState, useEffect, useMemo } from 'react';
import { getContractTransactions, getContractBalances } from '../utils/etherscan';
import { MONITORED_CONTRACTS } from '../utils/contracts';

export function useTreasury(
  timeRange: 'day' | 'week' | 'month' | 'year' | 'all' = 'month',
  options?: {
    contractTypes?: ('treasury' | 'token_buyer' | 'payer' | 'auction')[];
  }
) {
  const [rawData, setRawData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const relevantContracts = useMemo(() => {
    if (!options?.contractTypes) return MONITORED_CONTRACTS;
    return MONITORED_CONTRACTS.filter(c => 
      options.contractTypes?.includes(c.type)
    );
  }, [options?.contractTypes]);

  async function refreshData() {
    setIsLoading(true);
    setError(null);
    
    try {
      const newData: Record<string, any> = {};
      
      for (const contract of relevantContracts) {
        try {
          // Fetch fresh data
          const [transactions, balances] = await Promise.all([
            getContractTransactions(contract.address, timeRange),
            getContractBalances(contract.address)
          ]);
          
          newData[contract.address] = {
            transactions,
            balances,
            contractType: contract.type,
            contractName: contract.name,
            lastUpdated: Date.now()
          };
        } catch (contractError) {
          console.error(`Error processing contract ${contract.address}:`, contractError);
          // Continue with other contracts even if one fails
        }
      }
      
      setRawData(newData);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching treasury data:', err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refreshData();
  }, [timeRange, options?.contractTypes?.join(',')]);

  return { rawData, isLoading, error, refreshData };
} 