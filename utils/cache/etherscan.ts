import { EtherscanTransaction } from '../types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface ContractCache {
  transactions?: CacheEntry<EtherscanTransaction[]>;
  balances?: CacheEntry<{
    eth: string;
    usdc: string;
  }>;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const contractDataCache: Map<string, ContractCache> = new Map();

export function getCachedTransactions(contractAddress: string): EtherscanTransaction[] | null {
  const cache = contractDataCache.get(contractAddress);
  if (!cache?.transactions) return null;
  
  const isExpired = Date.now() - cache.transactions.timestamp > CACHE_DURATION;
  return isExpired ? null : cache.transactions.data;
}

export function getCachedBalances(contractAddress: string): { eth: string; usdc: string; } | null {
  const cache = contractDataCache.get(contractAddress);
  if (!cache?.balances) return null;
  
  const isExpired = Date.now() - cache.balances.timestamp > CACHE_DURATION;
  return isExpired ? null : cache.balances.data;
}

export function cacheTransactions(contractAddress: string, transactions: EtherscanTransaction[]): void {
  const existing = contractDataCache.get(contractAddress) || {};
  contractDataCache.set(contractAddress, {
    ...existing,
    transactions: {
      data: transactions,
      timestamp: Date.now()
    }
  });
}

export function cacheBalances(contractAddress: string, balances: { eth: string; usdc: string; }): void {
  const existing = contractDataCache.get(contractAddress) || {};
  contractDataCache.set(contractAddress, {
    ...existing,
    balances: {
      data: balances,
      timestamp: Date.now()
    }
  });
} 