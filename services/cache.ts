import { kv } from '@vercel/kv';
import { EtherscanTransaction } from '../utils/types';

const CACHE_DURATION = 5 * 60; // 5 minutes in seconds

interface CacheMetrics {
  hits: number;
  misses: number;
  errors: number;
}

class ContractDataCache {
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    errors: 0
  };

  private async getCacheKey(contractAddress: string, type: 'tx' | 'bal'): Promise<string> {
    return `${type}:${contractAddress.toLowerCase()}`;
  }

  private logError(operation: string, error: unknown) {
    this.metrics.errors++;
    console.error(`Cache ${operation} error:`, error);
  }

  async getMetrics(): Promise<CacheMetrics> {
    return this.metrics;
  }

  async getTransactions(contractAddress: string): Promise<EtherscanTransaction[]> {
    try {
      const key = await this.getCacheKey(contractAddress, 'tx');
      const cached = await kv.get<EtherscanTransaction[]>(key);
      
      if (cached) {
        this.metrics.hits++;
        return cached;
      }
      
      this.metrics.misses++;
      return [];
    } catch (error) {
      this.logError('read', error);
      return [];
    }
  }

  async setTransactions(contractAddress: string, transactions: EtherscanTransaction[]): Promise<void> {
    try {
      const key = await this.getCacheKey(contractAddress, 'tx');
      await kv.set(key, transactions, { ex: CACHE_DURATION });
    } catch (error) {
      this.logError('write', error);
    }
  }

  async getBalances(contractAddress: string): Promise<{ eth: string; usdc: string; }> {
    try {
      const key = await this.getCacheKey(contractAddress, 'bal');
      const cached = await kv.get<{ eth: string; usdc: string; }>(key);
      
      if (cached) {
        this.metrics.hits++;
        return cached;
      }
      
      this.metrics.misses++;
      return { eth: '0', usdc: '0' };
    } catch (error) {
      this.logError('read', error);
      return { eth: '0', usdc: '0' };
    }
  }

  async setBalances(contractAddress: string, balances: { eth: string; usdc: string; }): Promise<void> {
    try {
      const key = await this.getCacheKey(contractAddress, 'bal');
      await kv.set(key, balances, { ex: CACHE_DURATION });
    } catch (error) {
      this.logError('write', error);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await kv.set('health-check', 'ok', { ex: 10 });
      const result = await kv.get('health-check');
      return result === 'ok';
    } catch (error) {
      this.logError('health-check', error);
      return false;
    }
  }
}

export const contractCache = new ContractDataCache(); 