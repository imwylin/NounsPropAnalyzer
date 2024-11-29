import { useState, useEffect, useMemo } from 'react';
import { getContractTransactions, getContractBalances } from '../utils/etherscan';
import { MONITORED_CONTRACTS } from '../utils/contracts';
import { get } from '@vercel/edge-config';

const CACHE_TTL = 60 * 60; // 1 hour in seconds

const debugCache = async (key: string, action: 'get' | 'set', data?: any) => {
  console.log(`Edge Config ${action}:`, key, data ? 'with data' : 'no data');
};

const serializeData = (data: any) => {
  return JSON.stringify(data);
};

const deserializeData = (data: string | null) => {
  return data ? JSON.parse(data) : null;
};

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
        const cacheKey = `treasury:${contract.address}:${timeRange}`;
        
        try {
          await debugCache(cacheKey, 'get');
          const cachedData = await get(cacheKey);
          let data = cachedData ? deserializeData(cachedData as string) : null;
          
          if (!data) {
            console.log('Cache miss, fetching from Etherscan:', contract.name);
            const [transactions, balances] = await Promise.all([
              getContractTransactions(contract.address, timeRange),
              getContractBalances(contract.address)
            ]);
            
            data = {
              transactions,
              balances,
              contractType: contract.type,
              contractName: contract.name,
              lastUpdated: Date.now()
            };
            
            await debugCache(cacheKey, 'set', data);
          } else {
            console.log('Cache hit for:', contract.name);
          }
          
          newData[contract.address] = data;
        } catch (configError) {
          console.error('Edge Config operation failed:', configError);
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

  return {
    rawData,
    isLoading,
    error,
    refreshData
  };
} 