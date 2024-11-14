import type { NextApiRequest, NextApiResponse } from 'next';
import Moralis from 'moralis';

const TREASURY_ADDRESS = '0xb1a32FC9F9D8b2cf86C068Cae13108809547ef71';
const AUCTION_HOUSE_ADDRESS = '0x830BD73E4184ceF73443C15111a1DF14e495C706';
const NOUNS_TOKEN_ADDRESS = '0x9C8fF314C9Bc7F6e59A9d9225Fb22946427eDC03';
const TOKEN_BUYER_ADDRESS = '0x4f2acdc74f6941390d9b1804fabc3e780388cfe5';

// Add the known contracts mapping
const KNOWN_CONTRACTS: { [key: string]: string } = {
  '0x6f3E6272A167e8AcCb32072d08E0957F9c79223d': 'Nouns DAO',
  '0x830BD73E4184ceF73443C15111a1DF14e495C706': 'Nouns Auction House',
  '0x9C8fF314C9Bc7F6e59A9d9225Fb22946427eDC03': 'Nouns Token',
  '0x0BC3807Ec262cB779b38D65b38158acC3bfedE10': 'Nouns DAO Executor',
  '0xa43aFE317985726E4e194eb061Af77fbCb43F944': 'Nouns DAO Executor Proxy',
  '0x4f2acdc74f6941390d9b1804fabc3e780388cfe5': 'Token Buyer'
};

// Add the getContractDetails function
function getContractDetails(address: string): string {
  return KNOWN_CONTRACTS[address.toLowerCase()] || 'Unknown Contract';
}

// Remove or comment out the unused Transaction import
// import { Transaction } from '@prisma/client'  // Remove this line if not needed

interface MoralisNFTTransfer {
  token_address: string;
  token_id: string;
  from_address: string;
  to_address: string;
  amount: string;
  contract_type: string;
  block_timestamp: string;
  transaction_hash: string;
}

interface MoralisNativeTransfer {
  from_address: string;
  to_address: string;
  value: string;
  value_formatted: string;
}

interface MoralisERC20Transfer {
  token_address: string;
  token_symbol: string;
  from_address: string;
  to_address: string;
  value: string;
  value_formatted: string;
}

interface ProcessedTransaction {
  hash: string;
  from_address: string;
  to_address?: string;
  block_timestamp: string;
  nft_transfers?: MoralisNFTTransfer[];
  native_transfers?: MoralisNativeTransfer[];
  erc20_transfers?: MoralisERC20Transfer[];
  type: 'auction' | 'treasury' | 'tokenBuyer';
  category: string;
  description: string;
  source: string;
  contractDetails: string;
  isAuctionSettlement: boolean;
  direction: string;
}

// Add MoralisResponse interface
interface MoralisResponse {
  result: {
    token_address: string;
    token_id: string;
    from_address: string | undefined;
    to_address: string | undefined;
    amount: string;
    contract_type: string;
    block_timestamp: string;
    transaction_hash: string;
  }[];
}

// Add this function before processTransaction
function processRawTransaction(tx: any): Partial<ProcessedTransaction> {
  return {
    hash: tx.hash,
    from_address: tx.from_address || '',
    to_address: tx.to_address,
    block_timestamp: tx.block_timestamp,
    nft_transfers: tx.nft_transfers,
    native_transfers: tx.native_transfers,
    erc20_transfers: tx.erc20_transfers,
    type: 'treasury' as const,
    category: '',
    description: '',
    source: 'treasury',
    contractDetails: '',
    isAuctionSettlement: false,
    direction: ''
  };
}

function processTransaction(
  tx: any, // Use any temporarily for the input since Moralis types are complex
  type: 'auction' | 'treasury' | 'tokenBuyer'
): ProcessedTransaction {
  const isNounsTransfer = tx.nft_transfers?.some((transfer: MoralisNFTTransfer) => 
    transfer.token_address.toLowerCase() === NOUNS_TOKEN_ADDRESS.toLowerCase()
  ) ?? false;

  const hasEthTransfer = Array.isArray(tx.native_transfers) && tx.native_transfers.length > 0;
  const hasErc20Transfer = Array.isArray(tx.erc20_transfers) && tx.erc20_transfers.length > 0;
  const ethAmount = hasEthTransfer ? tx.native_transfers[0].value_formatted : null;

  let category = 'Contract Interaction';
  let description = 'Contract Interaction';
  let contractDetails = '';
  let direction = '';

  // Determine direction for ETH and ERC-20 transfers
  if (type === 'treasury' && (hasEthTransfer || hasErc20Transfer)) {
    if (hasEthTransfer && tx.native_transfers?.[0]) {
      const fromTreasury = tx.native_transfers[0].from_address.toLowerCase() === TREASURY_ADDRESS.toLowerCase();
      direction = fromTreasury ? 'Outbound' : 'Inbound';
    } else if (hasErc20Transfer && tx.erc20_transfers?.[0]) {
      const fromTreasury = tx.erc20_transfers[0].from_address.toLowerCase() === TREASURY_ADDRESS.toLowerCase();
      direction = fromTreasury ? 'Outbound' : 'Inbound';
    }
  }

  // Get contract details
  if (tx.to_address) {
    contractDetails = getContractDetails(tx.to_address);
    if (contractDetails !== 'Unknown Contract') {
      description = `Interaction with ${contractDetails}`;
    }
  }

  // Categorize transaction
  if (isNounsTransfer && tx.nft_transfers) {
    const nftTransfer = tx.nft_transfers.find((t: MoralisNFTTransfer) => 
      t.token_address.toLowerCase() === NOUNS_TOKEN_ADDRESS.toLowerCase()
    );
    
    if (nftTransfer?.to_address?.toLowerCase() === AUCTION_HOUSE_ADDRESS.toLowerCase()) {
      category = 'NFT Transfer';
      description = `Noun #${nftTransfer.token_id} Transfer`;
    } else if (nftTransfer) {
      category = 'NFT Transfer';
      description = `Noun #${nftTransfer.token_id} Transfer`;
    }
  } else if (type === 'auction' && hasEthTransfer) {
    category = 'Auction Bid';
    description = `Bid ${ethAmount} ETH`;
  } else if (hasEthTransfer) {
    category = 'ETH Transfer';
    description = `${ethAmount} ETH`;
  } else if (hasErc20Transfer && tx.erc20_transfers?.[0]) {
    const erc20Transfer = tx.erc20_transfers[0];
    category = 'Token Transfer';
    description = `${erc20Transfer.value_formatted} ${erc20Transfer.token_symbol}`;
  }

  return {
    hash: tx.hash,
    from_address: tx.from_address,
    to_address: tx.to_address,
    block_timestamp: tx.block_timestamp,
    nft_transfers: tx.nft_transfers,
    native_transfers: tx.native_transfers,
    erc20_transfers: tx.erc20_transfers,
    type,
    category,
    description,
    source: type,
    contractDetails,
    isAuctionSettlement: false,
    direction
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const apiKey = process.env.MORALIS_API_KEY;
  const clientApiKey = req.headers['x-api-key'];

  if (!clientApiKey) {
    return res.status(400).json({
      error: 'Authentication failed',
      details: {
        field: 'x-api-key',
        message: 'API key is required'
      }
    });
  }

  if (clientApiKey !== apiKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      details: {
        field: 'x-api-key',
        message: 'Invalid API key'
      }
    });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    if (!process.env.MORALIS_API_KEY) {
      throw new Error('MORALIS_API_KEY is not configured');
    }

    try {
      await Moralis.start({
        apiKey: process.env.MORALIS_API_KEY
      });
    } catch (initError) {
      if (!(initError instanceof Error) || !initError.message.includes('started already')) {
        throw initError;
      }
    }

    // Fetch token balances
    const balancesResponse = await Moralis.EvmApi.wallets.getWalletTokenBalancesPrice({
      chain: "0x1",
      address: TREASURY_ADDRESS
    });

    // Fetch NFT transfers specifically from the Auction House
    const nftTransfersResponse = await Moralis.EvmApi.nft.getWalletNFTTransfers({
      chain: "0x1",
      address: AUCTION_HOUSE_ADDRESS,
      limit: 100,
    });

    // Fetch transactions for all contracts
    const [treasuryTxs, auctionTxs, tokenBuyerTxs] = await Promise.all([
      Moralis.EvmApi.wallets.getWalletHistory({
        chain: "0x1",
        address: TREASURY_ADDRESS,
        limit: 100
      }),
      Moralis.EvmApi.wallets.getWalletHistory({
        chain: "0x1",
        address: AUCTION_HOUSE_ADDRESS,
        limit: 100
      }),
      Moralis.EvmApi.wallets.getWalletHistory({
        chain: "0x1",
        address: TOKEN_BUYER_ADDRESS,
        limit: 100
      })
    ]);

    // Process NFT transfers from Auction House
    const nftTransfers = (nftTransfersResponse.toJSON() as MoralisResponse).result
      .filter((transfer: MoralisResponse['result'][0]) => 
        transfer.token_address?.toLowerCase() === NOUNS_TOKEN_ADDRESS.toLowerCase() &&
        transfer.from_address?.toLowerCase() === AUCTION_HOUSE_ADDRESS.toLowerCase()
      )
      .map((transfer: MoralisResponse['result'][0]) => ({
        hash: transfer.transaction_hash,
        block_timestamp: transfer.block_timestamp,
        from_address: transfer.from_address || '',
        to_address: transfer.to_address || '',
        type: 'auction' as const,
        category: 'NFT Transfer',
        description: `Noun #${transfer.token_id} Transfer`,
        source: 'auction'
      }));

    // Process transactions for each contract
    const treasury = treasuryTxs.toJSON().result.map(tx => 
      processTransaction(processRawTransaction(tx), 'treasury')
    );

    const auction = auctionTxs.toJSON().result.map(tx => 
      processTransaction(processRawTransaction(tx), 'auction')
    );

    const tokenBuyer = tokenBuyerTxs.toJSON().result.map(tx => 
      processTransaction(processRawTransaction(tx), 'tokenBuyer')
    );

    // Combine all transactions
    const allTransactions = [...treasury, ...auction, ...tokenBuyer, ...nftTransfers].sort((a, b) => 
      new Date(b.block_timestamp).getTime() - new Date(a.block_timestamp).getTime()
    );

    res.status(200).json({
      balances: balancesResponse.toJSON().result,
      transactions: allTransactions,
      addresses: {
        treasury: TREASURY_ADDRESS,
        auction: AUCTION_HOUSE_ADDRESS,
        token: NOUNS_TOKEN_ADDRESS,
        tokenBuyer: TOKEN_BUYER_ADDRESS
      }
    });
  } catch (error: unknown) {
    console.error('Treasury API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ 
      message: 'Error fetching treasury data',
      error: errorMessage 
    });
  }
} 