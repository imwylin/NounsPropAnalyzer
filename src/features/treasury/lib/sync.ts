import { Database } from '../../../lib/db/index';
import type { 
  Transaction, 
  InternalTransaction, 
  ERC20Transfer, 
  ERC721Transfer, 
  ERC1155Transfer,
  BaseTransaction
} from '../types/etherscan';
import { getMonitoredContracts, ContractConfig } from '../types/contracts';

// Etherscan API client
const ETHERSCAN_API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY;
const ETHERSCAN_API_URL = 'https://api.etherscan.io/api';

async function fetchBalance(address: string): Promise<string> {
  const url = `${ETHERSCAN_API_URL}?module=account&action=balance&address=${address}&tag=latest&apikey=${ETHERSCAN_API_KEY}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();

    // Log the response for debugging
    console.log(`Balance response for ${address}:`, data);

    if (data.message?.includes('rate limit')) {
      console.log('Rate limit hit while fetching balance, waiting 6 seconds...');
      await new Promise(resolve => setTimeout(resolve, 6000));
      return fetchBalance(address);
    }

    if (data.status !== '1' || !data.result) {
      console.error('Invalid balance response:', data);
      return '0';
    }

    // Validate that result is a valid number
    const balance = data.result.toString();
    if (!/^\d+$/.test(balance)) {
      console.error('Invalid balance format:', balance);
      return '0';
    }

    return balance;
  } catch (error) {
    console.error('Error fetching balance:', error);
    return '0';
  }
}

interface TokenBalance {
  contractAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  balance: string;
}

const LEGITIMATE_TOKENS = {
  USDC: {
    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    decimals: 6,
    name: 'USD Coin'
  },
  WETH: {
    address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    decimals: 18,
    name: 'Wrapped Ether'
  },
  STETH: {
    address: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84',
    decimals: 18,
    name: 'Lido Staked Ether'
  },
  WSTETH: {
    address: '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0',
    decimals: 18,
    name: 'Wrapped Staked Ether'
  },
  RETH: {
    address: '0xae78736cd615f374d3085123a210448e74fc6393',
    decimals: 18,
    name: 'Rocket Pool ETH'
  }
};

const MONITORED_NFT = {
  NOUNS: {
    address: '0x9C8fF314C9Bc7F6e59A9d9225Fb22946427eDC03',
    name: 'Nouns',
    symbol: 'NOUN'
  }
};

async function fetchNFTBalance(address: string, nftConfig: typeof MONITORED_NFT.NOUNS, retryCount = 0): Promise<string> {
  const maxRetries = 3;
  const retryDelay = 6000; // 6 seconds

  try {
    // Add delay before request
    await new Promise(resolve => setTimeout(resolve, 2000));

    const balanceUrl = `${ETHERSCAN_API_URL}?module=account&action=tokenbalance&contractaddress=${nftConfig.address}&address=${address}&tag=latest&apikey=${ETHERSCAN_API_KEY}`;
    const response = await fetch(balanceUrl);
    const data = await response.json();

    console.log(`NFT balance response for ${nftConfig.name} (${address}):`, data);

    if (data.message?.includes('rate limit')) {
      if (retryCount < maxRetries) {
        console.log(`Rate limit hit for ${nftConfig.name}, retry ${retryCount + 1}/${maxRetries} after ${retryDelay}ms`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return fetchNFTBalance(address, nftConfig, retryCount + 1);
      }
      throw new Error(`Rate limit exceeded after retries for ${nftConfig.name}`);
    }

    if (data.status !== '1' || !data.result) {
      console.error(`Invalid NFT balance response for ${nftConfig.name}:`, data);
      return '0';
    }

    // Validate that result is a valid number
    const balance = data.result.toString();
    if (!/^\d+$/.test(balance)) {
      console.error(`Invalid balance format for ${nftConfig.name}:`, balance);
      return '0';
    }

    console.log(`Successfully fetched NFT balance for ${nftConfig.name}: ${balance}`);
    return balance;
  } catch (error) {
    console.error(`Error fetching NFT balance for ${nftConfig.name}:`, error);
    return '0';
  }
}

async function fetchTokenBalance(address: string, tokenConfig: typeof LEGITIMATE_TOKENS[keyof typeof LEGITIMATE_TOKENS], retryCount = 0): Promise<string> {
  const maxRetries = 3;
  const retryDelay = 6000; // 6 seconds

  try {
    // Add delay before request
    await new Promise(resolve => setTimeout(resolve, 2000));

    const balanceUrl = `${ETHERSCAN_API_URL}?module=account&action=tokenbalance&contractaddress=${tokenConfig.address}&address=${address}&tag=latest&apikey=${ETHERSCAN_API_KEY}`;
    const response = await fetch(balanceUrl);
    const data = await response.json();

    console.log(`Token balance response for ${tokenConfig.name} (${address}):`, data);

    if (data.message?.includes('rate limit')) {
      if (retryCount < maxRetries) {
        console.log(`Rate limit hit for ${tokenConfig.name}, retry ${retryCount + 1}/${maxRetries} after ${retryDelay}ms`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return fetchTokenBalance(address, tokenConfig, retryCount + 1);
      }
      throw new Error(`Rate limit exceeded after retries for ${tokenConfig.name}`);
    }

    if (data.status !== '1' || !data.result) {
      console.error(`Invalid token balance response for ${tokenConfig.name}:`, data);
      return '0';
    }

    // Validate that result is a valid number
    const balance = data.result.toString();
    if (!/^\d+$/.test(balance)) {
      console.error(`Invalid balance format for ${tokenConfig.name}:`, balance);
      return '0';
    }

    console.log(`Successfully fetched balance for ${tokenConfig.name}: ${balance}`);
    return balance;
  } catch (error) {
    console.error(`Error fetching balance for ${tokenConfig.name}:`, error);
    return '0';
  }
}

async function fetchTokenBalances(address: string): Promise<TokenBalance[]> {
  try {
    const balances: TokenBalance[] = [];

    // Fetch balances for legitimate tokens only
    for (const [symbol, tokenConfig] of Object.entries(LEGITIMATE_TOKENS)) {
      console.log(`Starting balance fetch for ${symbol} (${tokenConfig.name})`);
      
      const balance = await fetchTokenBalance(address, tokenConfig);
      
      // Only add tokens with non-zero balances
      if (balance !== '0') {
        const tokenBalance = {
          contractAddress: tokenConfig.address.toLowerCase(),
          tokenName: tokenConfig.name,
          tokenSymbol: symbol,
          tokenDecimal: tokenConfig.decimals.toString(),
          balance: balance
        };
        
        console.log(`Adding token balance for ${symbol}:`, tokenBalance);
        balances.push(tokenBalance);
      } else {
        console.log(`Skipping zero balance for ${symbol}`);
      }
    }

    console.log('Final token balances array:', balances);
    return balances;
  } catch (error) {
    console.error('Error fetching token balances:', error);
    return [];
  }
}

async function fetchLatestBlock(): Promise<string> {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      // Add delay before request
      await new Promise(resolve => setTimeout(resolve, 1000));

      const latestBlockUrl = `${ETHERSCAN_API_URL}?module=proxy&action=eth_blockNumber&apikey=${ETHERSCAN_API_KEY}`;
      const blockResponse = await fetch(latestBlockUrl);
      const blockData = await blockResponse.json();

      console.log('Latest block response:', blockData);

      if (blockData.message?.includes('rate limit')) {
        console.log('Rate limit hit while fetching latest block, waiting 6 seconds...');
        await new Promise(resolve => setTimeout(resolve, 6000));
        retryCount++;
        continue;
      }
      
      if (!blockData.result) {
        console.error('Failed to get latest block:', blockData);
        throw new Error('Failed to get latest block');
      }
      
      const latestBlock = parseInt(blockData.result, 16).toString();
      if (isNaN(parseInt(latestBlock))) {
        console.error('Invalid block number:', blockData.result);
        throw new Error('Invalid block number');
      }
      
      console.log(`Latest Ethereum block: ${latestBlock}`);
      return latestBlock;
    } catch (error) {
      console.error('Error fetching latest block:', error);
      retryCount++;
      if (retryCount === maxRetries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 6000));
    }
  }

  throw new Error('Failed to fetch latest block after retries');
}

async function fetchTransactions(address: string, startBlock: string = '0', endBlock: string): Promise<{
  normal: Transaction[];
  internal: InternalTransaction[];
  erc20: ERC20Transfer[];
  erc721: ERC721Transfer[];
  erc1155: ERC1155Transfer[];
  latestBlock: string;
}> {
  try {
    const fetchFromEtherscan = async <T>(action: string): Promise<T[]> => {
      const url = `${ETHERSCAN_API_URL}?module=account&action=${action}&address=${address}&startblock=${startBlock}&endblock=${endBlock}&sort=asc&apikey=${ETHERSCAN_API_KEY}`;
      
      try {
        // Add delay before each request to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const response = await fetch(url);
        const data = await response.json();

        // Log the full URL (without API key) and response for debugging
        console.log(`Calling: ${url.replace(ETHERSCAN_API_KEY!, 'API_KEY')}`);
        console.log(`Response for ${action}:`, data);

        // Check for rate limit
        if (data.message?.includes('rate limit') || data.result?.includes('rate limit')) {
          console.log(`Rate limit reached for ${action}, waiting 6 seconds before retry`);
          await new Promise(resolve => setTimeout(resolve, 6000));
          return fetchFromEtherscan<T>(action);
        }

        // Handle "NOTOK" status
        if (data.status === '0') {
          if (data.message === 'No transactions found') {
            console.log(`No transactions found for ${action}`);
            return [];
          }
          console.error(`Error response for ${action}:`, data);
          return [];
        }

        // Validate response
        if (!Array.isArray(data.result)) {
          console.error(`Invalid ${action} result format:`, data.result);
          return [];
        }

        console.log(`Successfully fetched ${data.result.length} ${action} records`);
        return data.result;
      } catch (error) {
        console.error(`Error fetching ${action}:`, error);
        return [];
      }
    };

    console.log(`Syncing from block ${startBlock} to ${endBlock} for ${address}`);

    // Fetch each transaction type with delay between requests
    console.log(`Fetching normal transactions from block ${startBlock}`);
    const normal = await fetchFromEtherscan<Transaction>('txlist');
    
    console.log(`Fetching internal transactions from block ${startBlock}`);
    const internal = await fetchFromEtherscan<InternalTransaction>('txlistinternal');
    
    console.log(`Fetching ERC20 transfers from block ${startBlock}`);
    const erc20 = await fetchFromEtherscan<ERC20Transfer>('tokentx');
    
    console.log(`Fetching ERC721 transfers from block ${startBlock}`);
    const erc721 = await fetchFromEtherscan<ERC721Transfer>('tokennfttx');
    
    console.log(`Fetching ERC1155 transfers from block ${startBlock}`);
    const erc1155 = await fetchFromEtherscan<ERC1155Transfer>('token1155tx');

    return { normal, internal, erc20, erc721, erc1155, latestBlock: endBlock };
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return { 
      normal: [], 
      internal: [], 
      erc20: [], 
      erc721: [], 
      erc1155: [],
      latestBlock: endBlock
    };
  }
}

async function getLatestBlockNumber(): Promise<string> {
  const url = `${ETHERSCAN_API_URL}?module=proxy&action=eth_blockNumber&apikey=${ETHERSCAN_API_KEY}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.message?.includes('rate limit')) {
      console.log('Rate limit hit while fetching latest block, waiting 6 seconds...');
      await new Promise(resolve => setTimeout(resolve, 6000));
      return getLatestBlockNumber();
    }

    if (!data.result) {
      console.error('Invalid block number response:', data);
      return '0';
    }

    // Convert hex to decimal string
    return BigInt(data.result).toString();
  } catch (error) {
    console.error('Error fetching latest block:', error);
    return '0';
  }
}

export async function syncContract(address: string): Promise<void> {
  try {
    // Get both contract and sync status
    let [contract, status] = await Promise.all([
      Database.getContract(address),
      Database.getSyncStatus(address)
    ]);

    // Get contract configuration
    const contracts = await getMonitoredContracts();
    const contractConfig = contracts.find((c: ContractConfig) => c.address.toLowerCase() === address.toLowerCase());
    if (!contractConfig) {
      throw new Error('Contract not in monitored list');
    }

    // Initialize the contract if it doesn't exist
    if (!contract) {
      const initialContract = {
        address: contractConfig.address,
        name: contractConfig.name,
        type: contractConfig.type,
        balance: '0',
        tokenHoldings: [],
        nftHoldings: [],
        lastSync: new Date(),
        metadata: {
          lastSyncTime: Date.now(),
          transactionCounts: {
            normal: 0,
            internal: 0,
            erc20: 0,
            erc721: 0,
            erc1155: 0
          },
          isComplete: false,
          lastSyncBlock: '0',
          oldestSyncedBlock: '0'
        }
      };

      // Create contract first
      await Database.updateContract(contractConfig.address, initialContract);
      contract = initialContract;
    }

    // Initialize sync status if it doesn't exist
    if (!status) {
      const initialStatus = {
        contractAddress: address,
        inProgress: false,
        stage: 'initialized',
        progress: 0,
        lastSync: null,
        error: null,
        lastSyncedBlock: null
      };
      await Database.updateSyncStatus(address, initialStatus);
      status = initialStatus;
    }

    // Update sync status to in progress
    await Database.updateSyncStatus(address, {
      ...status,
      inProgress: true,
      stage: 'fetching',
      progress: 0,
      lastSync: new Date(),
      error: null
    });

    // Fetch balances
    const [ethBalance, tokenBalances, latestBlock] = await Promise.all([
      fetchBalance(address),
      fetchTokenBalances(address),
      getLatestBlockNumber()
    ]);

    // Fetch transactions starting from last synced block
    const transactions = await fetchTransactions(
      address,
      status?.lastSyncedBlock || '0',
      latestBlock
    );

    // Log raw transaction counts
    console.log('Raw transaction counts:', {
      normal: Array.isArray(transactions.normal) ? transactions.normal.length : 0,
      internal: Array.isArray(transactions.internal) ? transactions.internal.length : 0,
      erc20: Array.isArray(transactions.erc20) ? transactions.erc20.length : 0,
      erc721: Array.isArray(transactions.erc721) ? transactions.erc721.length : 0,
      erc1155: Array.isArray(transactions.erc1155) ? transactions.erc1155.length : 0
    });

    // Save all transactions in batches
    const allTransactions: BaseTransaction[] = [
      ...(Array.isArray(transactions.normal) ? transactions.normal.map(tx => {
        console.log('Processing normal tx:', { hash: tx.hash, from: tx.from, to: tx.to });
        return { 
          ...tx, 
          type: 'normal' as const,
          contractAddress: address,
          value: tx.value || '0',
          from: tx.from || address,
          to: tx.to || address,
          blockNumber: tx.blockNumber || '0',
          timeStamp: tx.timeStamp || Date.now().toString(),
          input: tx.input || '0x'
        };
      }) : []),
      ...(Array.isArray(transactions.internal) ? transactions.internal.map(tx => {
        console.log('Processing internal tx:', { hash: tx.hash, from: tx.from, to: tx.to });
        return { 
          ...tx, 
          type: 'internal' as const,
          contractAddress: address,
          value: tx.value || '0',
          from: tx.from || address,
          to: tx.to || address,
          blockNumber: tx.blockNumber || '0',
          timeStamp: tx.timeStamp || Date.now().toString(),
          input: tx.input || '0x'
        };
      }) : []),
      ...(Array.isArray(transactions.erc20) ? transactions.erc20.map(tx => {
        console.log('Processing ERC20 tx:', { hash: tx.hash, from: tx.from, to: tx.to, tokenSymbol: tx.tokenSymbol });
        return { 
          ...tx, 
          type: 'erc20' as const,
          contractAddress: address,
          value: tx.value || '0',
          from: tx.from || address,
          to: tx.to || address,
          blockNumber: tx.blockNumber || '0',
          timeStamp: tx.timeStamp || Date.now().toString(),
          input: tx.input || '0x'
        };
      }) : []),
      ...(Array.isArray(transactions.erc721) ? transactions.erc721.map(tx => {
        console.log('Processing ERC721 tx:', { hash: tx.hash, from: tx.from, to: tx.to, tokenId: tx.tokenID });
        return { 
          ...tx, 
          type: 'erc721' as const,
          contractAddress: address,
          value: '1',
          from: tx.from || address,
          to: tx.to || address,
          blockNumber: tx.blockNumber || '0',
          timeStamp: tx.timeStamp || Date.now().toString(),
          input: tx.input || '0x'
        };
      }) : []),
      ...(Array.isArray(transactions.erc1155) ? transactions.erc1155.map(tx => {
        console.log('Processing ERC1155 tx:', { hash: tx.hash, from: tx.from, to: tx.to, tokenId: tx.tokenID, value: tx.tokenValue });
        return { 
          ...tx, 
          type: 'erc1155' as const,
          contractAddress: address,
          value: tx.tokenValue || '1',
          from: tx.from || address,
          to: tx.to || address,
          blockNumber: tx.blockNumber || '0',
          timeStamp: tx.timeStamp || Date.now().toString(),
          input: tx.input || '0x'
        };
      }) : [])
    ]
    .filter(tx => {
      // For normal and internal transactions, check if the contract is involved
      if (tx.type === 'normal' || tx.type === 'internal') {
        const isInvolved = tx.from.toLowerCase() === address.toLowerCase() || 
                          tx.to.toLowerCase() === address.toLowerCase();
        if (!isInvolved) {
          console.log('Filtering out transaction - contract not involved:', {
            type: tx.type,
            hash: tx.hash,
            from: tx.from,
            to: tx.to
          });
        }
        return isInvolved;
      }
      // For token transfers, check if the contract is involved
      const isInvolved = tx.from.toLowerCase() === address.toLowerCase() || 
                        tx.to.toLowerCase() === address.toLowerCase();
      if (!isInvolved) {
        console.log('Filtering out token transfer - contract not involved:', {
          type: tx.type,
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          ...(tx.type === 'erc20' && { tokenSymbol: (tx as ERC20Transfer).tokenSymbol }),
          ...(tx.type === 'erc721' && { tokenId: (tx as ERC721Transfer).tokenID }),
          ...(tx.type === 'erc1155' && { 
            tokenId: (tx as ERC1155Transfer).tokenID,
            value: (tx as ERC1155Transfer).tokenValue 
          })
        });
      }
      return isInvolved;
    })
    .sort((a: BaseTransaction, b: BaseTransaction) => {
      // First compare timestamps
      const timeA = parseInt(a.timeStamp);
      const timeB = parseInt(b.timeStamp);
      if (timeA !== timeB) return timeA - timeB;
      
      // If timestamps are equal, compare block numbers
      const blockA = parseInt(a.blockNumber);
      const blockB = parseInt(b.blockNumber);
      return blockA - blockB;
    });

    console.log(`Found ${allTransactions.length} total transactions to save after filtering`);
    
    // Log transaction type breakdown after filtering
    const typeBreakdown = allTransactions.reduce((acc, tx) => {
      acc[tx.type] = (acc[tx.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log('Transaction type breakdown after filtering:', typeBreakdown);

    console.log(`Found ${allTransactions.length} total transactions to save after filtering`);
    console.log(`Time range: ${new Date(parseInt(allTransactions[0].timeStamp) * 1000).toISOString()} to ${new Date(parseInt(allTransactions[allTransactions.length - 1].timeStamp) * 1000).toISOString()}`);

    // Save transactions in larger batches - 1000 at a time
    const BATCH_SIZE = 1000;
    for (let i = 0; i < allTransactions.length; i += BATCH_SIZE) {
      const batch = allTransactions.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i/BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(allTransactions.length/BATCH_SIZE);
      console.log(`Saving batch ${batchNumber}/${totalBatches} (${batch.length} transactions)`);
      
      try {
        // Save transactions sequentially within each batch
        for (const tx of batch) {
          try {
            await Database.saveTransaction(tx);
          } catch (err) {
            // Type guard for error object
            if (err instanceof Error && err.message.includes('duplicate key')) {
              // Skip duplicates silently
              continue;
            }
            console.error(`Error saving transaction ${tx.hash}:`, err);
            // Continue with next transaction even if one fails
          }
        }
        console.log(`Successfully saved batch ${batchNumber}/${totalBatches}`);
      } catch (error) {
        console.error(`Error saving batch ${batchNumber}:`, error);
        // Continue with next batch even if one fails
      }

      // Add a small delay between batches to prevent connection overload
      if (i + BATCH_SIZE < allTransactions.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Update contract metadata with transaction counts and balances
    const metadata = {
      ...contract.metadata,
      transactionCounts: {
        normal: Array.isArray(transactions.normal) ? transactions.normal.length : 0,
        internal: Array.isArray(transactions.internal) ? transactions.internal.length : 0,
        erc20: Array.isArray(transactions.erc20) ? transactions.erc20.length : 0,
        erc721: Array.isArray(transactions.erc721) ? transactions.erc721.length : 0,
        erc1155: Array.isArray(transactions.erc1155) ? transactions.erc1155.length : 0
      },
      lastSyncTime: Date.now(),
      lastSyncBlock: transactions.latestBlock
    };

    // Update contract with new metadata and balances
    const updatedContract = {
      ...contract,
      balance: ethBalance,
      tokenHoldings: tokenBalances,
      metadata,
      lastSync: new Date()
    };

    // Update contract and sync status atomically
    await Promise.all([
      Database.updateContract(address, updatedContract),
      Database.updateSyncStatus(address, {
        ...status,
        inProgress: false,
        stage: 'complete',
        progress: 100,
        lastSync: new Date(),
        error: null,
        lastSyncedBlock: transactions.latestBlock
      })
    ]);

  } catch (error) {
    console.error('Error syncing contract:', error);
    
    // Update sync status with error
    await Database.updateSyncStatus(address, {
      contractAddress: address,
      inProgress: false,
      stage: 'error',
      progress: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
      lastSync: new Date()
    });
  }
}

async function updateContractBalances(address: string): Promise<void> {
  try {
    console.log(`Updating balances for contract: ${address}`);
    
    // Fetch ETH balance
    const balance = await fetchBalance(address);
    console.log(`ETH balance for ${address}:`, balance);

    // Fetch token balances
    const tokenHoldings = await fetchTokenBalances(address);
    console.log(`Token holdings for ${address}:`, tokenHoldings);

    // Fetch Nouns NFT balance
    const nounsBalance = await fetchNFTBalance(address, MONITORED_NFT.NOUNS);
    console.log(`Nouns NFT balance for ${address}:`, nounsBalance);

    // Prepare NFT holdings array
    const nftHoldings = nounsBalance !== '0' ? [{
      tokenId: '0', // We don't track individual token IDs for this overview
      tokenQuantity: nounsBalance,
      contractAddress: MONITORED_NFT.NOUNS.address.toLowerCase(),
      name: MONITORED_NFT.NOUNS.name,
      symbol: MONITORED_NFT.NOUNS.symbol
    }] : [];

    // Update contract in database
    await Database.updateContract(address, {
      address,
      balance,
      tokenHoldings,
      nftHoldings,
      lastSync: new Date()
    });

    console.log(`Successfully updated balances for ${address}`);
  } catch (error) {
    console.error(`Error updating balances for ${address}:`, error);
    throw error;
  }
}

async function updateContractTransactions(address: string): Promise<void> {
  try {
    console.log(`Updating transactions for contract: ${address}`);
    
    // Get latest block first
    const latestBlock = await fetchLatestBlock();
    console.log(`Latest block: ${latestBlock}`);
    
    // Get contract and sync status
    const [contract, status] = await Promise.all([
      Database.getContract(address),
      Database.getSyncStatus(address)
    ]);

    // Get contract configuration
    const contracts = await getMonitoredContracts();
    const contractConfig = contracts.find((c: ContractConfig) => c.address.toLowerCase() === address.toLowerCase());
    if (!contractConfig) {
      throw new Error('Contract not in monitored list');
    }

    // Initialize the contract if it doesn't exist
    if (!contract) {
      const initialContract = {
        address: contractConfig.address,
        name: contractConfig.name,
        type: contractConfig.type,
        balance: '0',
        tokenHoldings: [],
        nftHoldings: [],
        lastSync: new Date(),
        metadata: {
          lastSyncTime: Date.now(),
          transactionCounts: {
            normal: 0,
            internal: 0,
            erc20: 0,
            erc721: 0,
            erc1155: 0
          },
          isComplete: false,
          lastSyncBlock: '0',
          oldestSyncedBlock: '0'
        }
      };

      // Create contract first
      await Database.updateContract(contractConfig.address, initialContract);
    }

    // Initialize sync status if it doesn't exist
    if (!status) {
      await Database.updateSyncStatus(address, {
        contractAddress: address,
        inProgress: false,
        stage: 'initialized',
        progress: 0,
        lastSync: null,
        error: null,
        lastSyncedBlock: null
      });
    }

    // Get oldest synced block from metadata
    const oldestSyncedBlock = contract?.metadata?.oldestSyncedBlock || latestBlock;
    console.log(`Oldest synced block: ${oldestSyncedBlock}`);

    // Define block range size (adjust based on your needs)
    const BLOCK_RANGE = 500000; // About 3 months of blocks

    // Start from latest block and work backwards
    let endBlock = latestBlock;
    let startBlock = Math.max(0, parseInt(oldestSyncedBlock) - BLOCK_RANGE).toString();

    while (true) {
      // Ensure endBlock is never negative
      if (parseInt(endBlock) <= 0) {
        console.log('Reached genesis block, stopping sync');
        break;
      }

      console.log(`Processing blocks ${startBlock} to ${endBlock}`);

      // Fetch transactions for this block range
      const transactions = await fetchTransactions(address, startBlock, endBlock);

      // Process all transaction types
      const allTransactions: BaseTransaction[] = [
        ...(Array.isArray(transactions.normal) ? transactions.normal.map(tx => ({ 
          ...tx, 
          type: 'normal' as const,
          contractAddress: address,
          value: tx.value || '0',
          from: tx.from || address,
          to: tx.to || address,
          blockNumber: tx.blockNumber || '0',
          timeStamp: tx.timeStamp || Date.now().toString(),
          input: tx.input || '0x'
        })) : []),
        ...(Array.isArray(transactions.internal) ? transactions.internal.map(tx => ({ 
          ...tx, 
          type: 'internal' as const,
          contractAddress: address,
          value: tx.value || '0',
          from: tx.from || address,
          to: tx.to || address,
          blockNumber: tx.blockNumber || '0',
          timeStamp: tx.timeStamp || Date.now().toString(),
          input: tx.input || '0x'
        })) : []),
        ...(Array.isArray(transactions.erc20) ? transactions.erc20.map(tx => ({ 
          ...tx, 
          type: 'erc20' as const,
          contractAddress: address,
          value: tx.value || '0',
          from: tx.from || address,
          to: tx.to || address,
          blockNumber: tx.blockNumber || '0',
          timeStamp: tx.timeStamp || Date.now().toString(),
          input: tx.input || '0x'
        })) : []),
        ...(Array.isArray(transactions.erc721) ? transactions.erc721.map(tx => ({ 
          ...tx, 
          type: 'erc721' as const,
          contractAddress: address,
          value: '1',
          from: tx.from || address,
          to: tx.to || address,
          blockNumber: tx.blockNumber || '0',
          timeStamp: tx.timeStamp || Date.now().toString(),
          input: tx.input || '0x'
        })) : []),
        ...(Array.isArray(transactions.erc1155) ? transactions.erc1155.map(tx => ({ 
          ...tx, 
          type: 'erc1155' as const,
          contractAddress: address,
          value: tx.tokenValue || '1',
          from: tx.from || address,
          to: tx.to || address,
          blockNumber: tx.blockNumber || '0',
          timeStamp: tx.timeStamp || Date.now().toString(),
          input: tx.input || '0x'
        })) : [])
      ].filter(tx => {
        // For normal and internal transactions, check if the contract is involved
        if (tx.type === 'normal' || tx.type === 'internal') {
          return tx.from.toLowerCase() === address.toLowerCase() || 
                 tx.to.toLowerCase() === address.toLowerCase();
        }
        // For token transfers, check if the contract is involved
        return tx.from.toLowerCase() === address.toLowerCase() || 
               tx.to.toLowerCase() === address.toLowerCase();
      })
      // Sort transactions chronologically
      .sort((a, b) => {
        const timeA = parseInt(a.timeStamp);
        const timeB = parseInt(b.timeStamp);
        if (timeA !== timeB) return timeA - timeB;
        
        const blockA = parseInt(a.blockNumber);
        const blockB = parseInt(b.blockNumber);
        return blockA - blockB;
      });

      const filteredCount = allTransactions.length;
      console.log(`Found ${filteredCount} transactions in blocks ${startBlock} to ${endBlock}`);

      if (filteredCount > 0) {
        // Save transactions in batches
        const BATCH_SIZE = 1000;
        for (let i = 0; i < allTransactions.length; i += BATCH_SIZE) {
          const batch = allTransactions.slice(i, i + BATCH_SIZE);
          const batchNumber = Math.floor(i/BATCH_SIZE) + 1;
          const totalBatches = Math.ceil(allTransactions.length/BATCH_SIZE);
          
          try {
            // Save transactions sequentially
            for (const tx of batch) {
              try {
                await Database.saveTransaction(tx);
              } catch (err) {
                if (err instanceof Error && err.message.includes('duplicate key')) {
                  // Skip duplicates silently
                  continue;
                }
                console.error(`Error saving transaction ${tx.hash}:`, err);
              }
            }
            console.log(`Saved batch ${batchNumber}/${totalBatches} for blocks ${startBlock}-${endBlock}`);
          } catch (error) {
            console.error(`Error saving batch ${batchNumber}:`, error);
          }

          // Add delay between batches
          if (i + BATCH_SIZE < allTransactions.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      // Update contract metadata with new oldest synced block
      const updatedContract = await Database.getContract(address);
      if (updatedContract) {
        const metadata = {
          ...updatedContract.metadata,
          oldestSyncedBlock: startBlock
        };

        await Database.updateContract(address, {
          ...updatedContract,
          metadata
        });
      }

      // Move to next block range
      endBlock = (parseInt(startBlock) - 1).toString();
      if (parseInt(endBlock) <= 0) {
        console.log('Reached genesis block, stopping sync');
        break;
      }
      startBlock = Math.max(0, parseInt(endBlock) - BLOCK_RANGE).toString();

      // Add delay between ranges to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Update sync status to complete
    await Database.updateSyncStatus(address, {
      contractAddress: address,
      inProgress: false,
      stage: 'complete',
      progress: 100,
      lastSync: new Date(),
      error: null,
      lastSyncedBlock: latestBlock
    });

    console.log(`Successfully synced all transactions for ${address}`);
  } catch (error) {
    console.error(`Error updating transactions for ${address}:`, error);
    
    // Update sync status with error
    await Database.updateSyncStatus(address, {
      contractAddress: address,
      inProgress: false,
      stage: 'error',
      progress: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
      lastSync: new Date()
    });
    
    throw error;
  }
}

export async function startBackgroundSync(): Promise<void> {
  try {
    console.log('Starting background sync process...');
    
    // Get monitored contracts - use a Set to ensure uniqueness by address
    const contracts = await getMonitoredContracts();
    const uniqueContracts = Array.from(
      new Map(contracts.map((contract: ContractConfig) => [contract.address.toLowerCase(), contract])).values()
    ) as ContractConfig[];
    
    console.log(`Found ${uniqueContracts.length} unique contracts to sync`);

    // Get latest block first
    const latestBlock = await fetchLatestBlock();
    console.log(`Latest block: ${latestBlock}`);
    
    // Update each contract's data
    for (const contract of uniqueContracts) {
      console.log(`Starting sync for ${contract.name} (${contract.address})`);
      
      try {
        // First update balances (faster operation)
        await updateContractBalances(contract.address);
        console.log(`Updated balances for ${contract.name}`);
        
        // Then update transactions (slower, more intensive operation)
        await updateContractTransactions(contract.address);
        console.log(`Updated transactions for ${contract.name}`);
      } catch (error) {
        console.error(`Error syncing ${contract.name}:`, error);
        // Continue with other contracts even if one fails
      }
      
      // Add delay between contracts to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('Background sync completed');
  } catch (error) {
    console.error('Error in background sync:', error);
    throw error;
  }
} 