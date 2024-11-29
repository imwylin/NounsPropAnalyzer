import axios from 'axios';
import { sleep } from './helpers';
import { EtherscanTransaction } from './types';
import { contractCache } from '../services/cache';

const ETHERSCAN_API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY;
const ETHERSCAN_BASE_URL = 'https://api.etherscan.io/api';

// Constants
export const USDC_CONTRACT = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
export const NOUNS_TOKEN_CONTRACT = '0x9C8fF314C9Bc7F6e59A9d9225Fb22946427eDC03';

// Add this function to get block number for a timestamp
async function getBlockNumberAtTimestamp(timestamp: number): Promise<number> {
  try {
    const response = await axios.get(ETHERSCAN_BASE_URL, {
      params: {
        module: 'block',
        action: 'getblocknobytime',
        timestamp: timestamp.toString(),
        closest: 'before',
        apikey: ETHERSCAN_API_KEY,
      },
    });

    if (response.data.status === '1') {
      return parseInt(response.data.result);
    }
    throw new Error(response.data.message);
  } catch (error) {
    console.error('Error fetching block number:', error);
    throw error;
  }
}

// Add a helper function for timestamp handling
function normalizeTransaction(tx: Partial<EtherscanTransaction>): EtherscanTransaction {
  return {
    ...tx,
    // Ensure timeStamp is consistently a Unix timestamp in seconds
    timeStamp: tx.timeStamp 
      ? (tx.timeStamp.length > 10 ? Math.floor(parseInt(tx.timeStamp) / 1000).toString() : tx.timeStamp)
      : (Math.floor(Date.now() / 1000)).toString(),
    // Ensure transactionType is set
    transactionType: tx.transactionType || 'normal'
  } as EtherscanTransaction;
}

async function rateLimitedCall<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (error.message?.includes('rate limit')) {
      await sleep(200); // Wait 200ms
      return rateLimitedCall(fn);
    }
    throw error;
  }
}

// Update the getContractTransactions function to accept a time range
export async function getContractTransactions(
  contractAddress: string,
  timeRange: 'day' | 'week' | 'month' | 'year' | 'all' = 'month'
): Promise<EtherscanTransaction[]> {
  // Check cache first
  const cached = await contractCache.getTransactions(contractAddress);
  if (cached.length > 0) return cached;

  try {
    // Get normal ETH transactions
    const [ethTxResponse, tokenTxResponse, nftTxResponse] = await Promise.all([
      rateLimitedCall(() => axios.get(ETHERSCAN_BASE_URL, {
        params: {
          module: 'account',
          action: 'txlist',
          address: contractAddress,
          sort: 'desc',
          apikey: ETHERSCAN_API_KEY,
        },
      })),
      rateLimitedCall(() => axios.get(ETHERSCAN_BASE_URL, {
        params: {
          module: 'account',
          action: 'tokentx',
          address: contractAddress,
          sort: 'desc',
          apikey: ETHERSCAN_API_KEY,
        },
      })),
      rateLimitedCall(() => axios.get(ETHERSCAN_BASE_URL, {
        params: {
          module: 'account',
          action: 'tokennfttx',
          address: contractAddress,
          sort: 'desc',
          apikey: ETHERSCAN_API_KEY,
        },
      }))
    ]);

    // Normalize and combine all transactions
    const ethTxs = (ethTxResponse.data.status === '1' ? ethTxResponse.data.result : [])
      .map((tx: Partial<EtherscanTransaction>) => ({ 
        ...normalizeTransaction(tx), 
        transactionType: 'normal',
        tokenSymbol: 'ETH'
      }));
    
    const tokenTxs = (tokenTxResponse.data.status === '1' ? tokenTxResponse.data.result : [])
      .map((tx: Partial<EtherscanTransaction>) => ({ 
        ...normalizeTransaction(tx), 
        transactionType: 'token',
        tokenSymbol: tx.tokenSymbol || 'UNKNOWN'
      }));
    
    const nftTxs = (nftTxResponse.data.status === '1' ? nftTxResponse.data.result : [])
      .map((tx: Partial<EtherscanTransaction>) => ({ 
        ...normalizeTransaction(tx), 
        transactionType: 'nft'
      }));

    // Combine and sort all transactions by timestamp
    const allTxs = [...ethTxs, ...tokenTxs, ...nftTxs]
      .sort((a, b) => parseInt(b.timeStamp) - parseInt(a.timeStamp));

    // Cache the results
    await contractCache.setTransactions(contractAddress, allTxs);
    
    return allTxs;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
}

export async function getContractBalances(contractAddress: string) {
  // Check cache first
  const cached = await contractCache.getBalances(contractAddress);
  if (cached.eth !== '0' || cached.usdc !== '0') return cached;

  try {
    // Get ETH balance
    const ethBalanceResponse = await axios.get(ETHERSCAN_BASE_URL, {
      params: {
        module: 'account',
        action: 'balance',
        address: contractAddress,
        tag: 'latest',
        apikey: ETHERSCAN_API_KEY,
      },
    });

    // Get USDC balance
    const usdcBalanceResponse = await axios.get(ETHERSCAN_BASE_URL, {
      params: {
        module: 'account',
        action: 'tokenbalance',
        contractaddress: USDC_CONTRACT,
        address: contractAddress,
        tag: 'latest',
        apikey: ETHERSCAN_API_KEY,
      },
    });

    // Log responses for debugging
    console.log('ETH Balance Response:', ethBalanceResponse.data);
    console.log('USDC Balance Response:', usdcBalanceResponse.data);

    const balances = {
      eth: ethBalanceResponse.data.status === '1' ? ethBalanceResponse.data.result : '0',
      usdc: usdcBalanceResponse.data.status === '1' ? usdcBalanceResponse.data.result : '0',
    };

    // Cache the results
    contractCache.setBalances(contractAddress, balances);
    
    return balances;
  } catch (error) {
    console.error('Error fetching balances:', error);
    return { eth: '0', usdc: '0' };
  }
}

// Helper function to identify token transactions
export function isTokenTransaction(tx: EtherscanTransaction): boolean {
  return !!tx.tokenSymbol;
}

// Helper function to get token decimals
export function getTokenDecimals(tx: EtherscanTransaction): number {
  if (tx.tokenSymbol === 'USDC') {
    return 6;
  }
  return parseInt(tx.tokenDecimal || '18');
}

// Update the transaction type helper
function getTransactionType(tx: EtherscanTransaction): string {
  if (tx.tokenID && tx.contractAddress?.toLowerCase() === NOUNS_TOKEN_CONTRACT.toLowerCase()) {
    return `Noun #${tx.tokenID} Transfer`;
  }
  if (tx.tokenID) {
    return `NFT Transfer #${tx.tokenID}`;
  }
  if (tx.functionName) {
    return tx.functionName.split('(')[0];
  }
  if (tx.tokenSymbol) {
    return `${tx.tokenSymbol} Transfer`;
  }
  if (tx.transactionType === 'internal') {
    return 'Internal ETH Transfer';
  }
  return 'ETH Transfer';
}

// Change function names to match imports
export const fetchTransactions = getContractTransactions;
export const fetchBalance = async (address: string, tokenType: 'ETH' | 'USDC') => {
  const balances = await getContractBalances(address);
  return tokenType === 'ETH' ? balances.eth : balances.usdc;
}; 