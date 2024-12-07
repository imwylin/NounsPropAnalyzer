import type { 
  Transaction, 
  InternalTransaction, 
  ERC20Transfer, 
  ERC721Transfer, 
  ERC1155Transfer 
} from '../types/etherscan';

const ETHERSCAN_API_URL = 'https://api.etherscan.io/api';
const API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY;
const RATE_LIMIT_DELAY = 250; // 4 requests per second max
const MAX_RETRIES = 5;

interface EtherscanResponse<T> {
  status: string;
  message: string;
  result: T;
}

class EtherscanClient {
  private lastRequestTime = 0;

  private async rateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest));
    }
    this.lastRequestTime = Date.now();
  }

  private async fetch<T>(params: Record<string, string>, retryCount = 0): Promise<T> {
    await this.rateLimit();

    try {
      const queryParams = new URLSearchParams({
        apikey: API_KEY!,
        ...params
      });

      const url = `${ETHERSCAN_API_URL}?${queryParams}`;
      const response = await fetch(url);
      const data = await response.json() as EtherscanResponse<T>;

      if (data.message === 'OK' && data.result !== undefined) {
        return data.result;
      }

      if (data.message === 'No transactions found' || data.message === 'No records found') {
        return [] as unknown as T;
      }

      if (data.message.includes('rate limit')) {
        const waitTime = RATE_LIMIT_DELAY * Math.pow(2, retryCount);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        if (retryCount < MAX_RETRIES) {
          return this.fetch<T>(params, retryCount + 1);
        }
      }

      throw new Error(`API Error: ${data.message || 'Unknown error'}`);
    } catch (error) {
      if (retryCount < MAX_RETRIES) {
        const waitTime = RATE_LIMIT_DELAY * Math.pow(2, retryCount);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.fetch<T>(params, retryCount + 1);
      }
      throw error;
    }
  }

  async getNormalTransactions(address: string, startBlock: string = '0'): Promise<Transaction[]> {
    return this.fetch<Transaction[]>({
      module: 'account',
      action: 'txlist',
      address,
      startblock: startBlock,
      endblock: '999999999',
      sort: 'asc',
      offset: '10000',
      page: '1'
    });
  }

  async getInternalTransactions(address: string, startBlock: string = '0'): Promise<InternalTransaction[]> {
    return this.fetch<InternalTransaction[]>({
      module: 'account',
      action: 'txlistinternal',
      address,
      startblock: startBlock,
      endblock: '999999999',
      sort: 'asc',
      offset: '10000',
      page: '1'
    });
  }

  async getERC20Transfers(address: string, startBlock: string = '0'): Promise<ERC20Transfer[]> {
    return this.fetch<ERC20Transfer[]>({
      module: 'account',
      action: 'tokentx',
      address,
      startblock: startBlock,
      endblock: '999999999',
      sort: 'asc',
      offset: '10000',
      page: '1'
    });
  }

  async getERC721Transfers(address: string, startBlock: string = '0'): Promise<ERC721Transfer[]> {
    return this.fetch<ERC721Transfer[]>({
      module: 'account',
      action: 'tokennfttx',
      address,
      startblock: startBlock,
      endblock: '999999999',
      sort: 'asc',
      offset: '10000',
      page: '1'
    });
  }

  async getERC1155Transfers(address: string, startBlock: string = '0'): Promise<ERC1155Transfer[]> {
    return this.fetch<ERC1155Transfer[]>({
      module: 'account',
      action: 'token1155tx',
      address,
      startblock: startBlock,
      endblock: '999999999',
      sort: 'asc',
      offset: '10000',
      page: '1'
    });
  }
}

const client = new EtherscanClient();

export async function fetchTransactions(address: string, startBlock: string = '0') {
  const [normal, internal, erc20, erc721, erc1155] = await Promise.all([
    client.getNormalTransactions(address, startBlock),
    client.getInternalTransactions(address, startBlock),
    client.getERC20Transfers(address, startBlock),
    client.getERC721Transfers(address, startBlock),
    client.getERC1155Transfers(address, startBlock)
  ]);

  return {
    normal,
    internal,
    erc20,
    erc721,
    erc1155
  };
} 