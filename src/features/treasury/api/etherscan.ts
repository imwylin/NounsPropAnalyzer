import { 
  Transaction, 
  InternalTransaction, 
  ERC20Transfer, 
  ERC721Transfer, 
  ERC1155Transfer 
} from '../types/etherscan';

// Token contract addresses
const TOKEN_ADDRESSES = {
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  STETH: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
  WSTETH: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
  RETH: '0xae78736Cd615f374D3085123A210448E74Fc6393'
};

interface TokenBalance {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  balance: string;
  tokenDecimal: string;
}

interface NFTHolding {
  tokenId: string;
  tokenQuantity: string;
  contractAddress: string;
  name: string;
  symbol: string;
}

type EtherscanResponse<T> = {
  status: string;
  message: string;
  result: T;
};

export class EtherscanAPI {
  private apiKey: string;
  private baseUrl: string;

  constructor(
    apiKey: string = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY || '',
    baseUrl: string = 'https://api.etherscan.io/api'
  ) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  private async handleRateLimit(retryAfter: number = 5000): Promise<void> {
    console.log(`Rate limit hit, waiting ${retryAfter}ms before retry`);
    await new Promise(resolve => setTimeout(resolve, retryAfter));
  }

  private async fetch<T>(params: Record<string, string>): Promise<T> {
    const queryString = new URLSearchParams({
      ...params,
      apikey: this.apiKey
    }).toString();

    const url = `${this.baseUrl}?${queryString}`;
    const response = await fetch(url);
    const data = await response.json() as EtherscanResponse<T>;

    const isRateLimited = 
      (typeof data.message === 'string' && data.message.includes('rate limit')) ||
      (typeof data.result === 'string' && data.result.includes('rate limit'));

    if (isRateLimited) {
      await this.handleRateLimit();
      return this.fetch<T>(params);
    }

    if (data.status !== '1') {
      console.error('API Error:', data);
      throw new Error(data.message || 'API request failed');
    }

    return data.result;
  }

  async getLatestBlock(): Promise<string> {
    const result = await this.fetch<string>({
      module: 'proxy',
      action: 'eth_blockNumber'
    });
    return parseInt(result, 16).toString();
  }

  async getNormalTransactions(
    address: string,
    startBlock: string = '0',
    endBlock: string = '999999999'
  ): Promise<Transaction[]> {
    console.log(`Fetching normal transactions for ${address} from block ${startBlock} to ${endBlock}`);
    return this.fetch<Transaction[]>({
      module: 'account',
      action: 'txlist',
      address,
      startblock: startBlock,
      endblock: endBlock,
      sort: 'desc',
      offset: '10000',
      page: '1'
    });
  }

  async getInternalTransactions(
    address: string,
    startBlock: string = '0',
    endBlock: string = '999999999'
  ): Promise<InternalTransaction[]> {
    console.log(`Fetching internal transactions for ${address} from block ${startBlock} to ${endBlock}`);
    return this.fetch<InternalTransaction[]>({
      module: 'account',
      action: 'txlistinternal',
      address,
      startblock: startBlock,
      endblock: endBlock,
      sort: 'desc',
      offset: '10000',
      page: '1'
    });
  }

  async getERC20Transfers(
    address: string,
    startBlock: string = '0',
    endBlock: string = '999999999'
  ): Promise<ERC20Transfer[]> {
    console.log(`Fetching ERC20 transfers for ${address} from block ${startBlock} to ${endBlock}`);
    return this.fetch<ERC20Transfer[]>({
      module: 'account',
      action: 'tokentx',
      address,
      startblock: startBlock,
      endblock: endBlock,
      sort: 'desc',
      offset: '10000',
      page: '1'
    });
  }

  async getERC721Transfers(
    address: string,
    startBlock: string = '0',
    endBlock: string = '999999999'
  ): Promise<ERC721Transfer[]> {
    console.log(`Fetching ERC721 transfers for ${address} from block ${startBlock} to ${endBlock}`);
    return this.fetch<ERC721Transfer[]>({
      module: 'account',
      action: 'tokennfttx',
      address,
      startblock: startBlock,
      endblock: endBlock,
      sort: 'desc',
      offset: '10000',
      page: '1'
    });
  }

  async getERC1155Transfers(
    address: string,
    startBlock: string = '0',
    endBlock: string = '999999999'
  ): Promise<ERC1155Transfer[]> {
    console.log(`Fetching ERC1155 transfers for ${address} from block ${startBlock} to ${endBlock}`);
    return this.fetch<ERC1155Transfer[]>({
      module: 'account',
      action: 'token1155tx',
      address,
      startblock: startBlock,
      endblock: endBlock,
      sort: 'desc',
      offset: '10000',
      page: '1'
    });
  }

  async getBalance(address: string): Promise<string> {
    console.log(`Fetching ETH balance for ${address}`);
    return this.fetch<string>({
      module: 'account',
      action: 'balance',
      address,
      tag: 'latest'
    });
  }

  async getERC20Holdings(address: string): Promise<TokenBalance[]> {
    console.log(`Fetching ERC20 holdings for ${address}`);
    const balances: TokenBalance[] = [];
    
    // Fetch token balances sequentially to respect rate limits
    for (const [symbol, tokenAddress] of Object.entries(TOKEN_ADDRESSES)) {
      try {
        const balance = await this.fetch<string>({
          module: 'account',
          action: 'tokenbalance',
          contractaddress: tokenAddress,
          address,
          tag: 'latest'
        });

        balances.push({
          tokenAddress: tokenAddress,
          tokenName: symbol,
          tokenSymbol: symbol,
          balance: balance || '0',
          tokenDecimal: symbol === 'USDC' ? '6' : '18'
        });
      } catch (error) {
        console.error(`Error fetching ${symbol} balance for ${address}:`, error);
        balances.push({
          tokenAddress: tokenAddress,
          tokenName: symbol,
          tokenSymbol: symbol,
          balance: '0',
          tokenDecimal: symbol === 'USDC' ? '6' : '18'
        });
      }
    }

    return balances;
  }

  async getNFTHoldings(address: string, contractAddress?: string): Promise<NFTHolding[]> {
    console.log(`Fetching NFT holdings for ${address}`);
    const nftAddresses = contractAddress ? [contractAddress] : ['0x9C8fF314C9Bc7F6e59A9d9225Fb22946427eDC03']; // Default to Nouns NFT
    const holdings: NFTHolding[] = [];

    for (const nftAddress of nftAddresses) {
      try {
        const transfers = await this.fetch<ERC721Transfer[]>({
          module: 'account',
          action: 'tokennfttx',
          contractaddress: nftAddress,
          address,
          sort: 'asc'
        });

        if (!transfers || transfers.length === 0) {
          console.log(`No NFT transfers found for contract ${nftAddress}`);
          continue;
        }

        // Calculate current balance by tracking transfers
        const balance = transfers.reduce((acc, tx) => {
          if (tx.to.toLowerCase() === address.toLowerCase()) {
            return acc + 1;
          } else if (tx.from.toLowerCase() === address.toLowerCase()) {
            return acc - 1;
          }
          return acc;
        }, 0);

        if (balance > 0) {
          holdings.push({
            contractAddress: nftAddress,
            name: transfers[0]?.tokenName || 'Unknown',
            symbol: transfers[0]?.tokenSymbol || 'NFT',
            tokenId: transfers[0]?.tokenID || '0',
            tokenQuantity: balance.toString()
          });
        }
      } catch (error) {
        console.error(`Error fetching NFTs for contract ${nftAddress}:`, error);
      }
    }

    return holdings;
  }
} 