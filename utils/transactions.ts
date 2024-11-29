import { formatUnits } from 'ethers';
import { 
  TreasuryData, 
  EnhancedTransaction, 
  NounTransaction, 
  USDCTransaction,
  EtherscanTransaction 
} from './types';
import { MONITORED_CONTRACTS } from './contracts';

// Contract addresses
const CONTRACTS = {
  NOUNS_TOKEN: '0x9C8fF314C9Bc7F6e59A9d9225Fb22946427eDC03'.toLowerCase(),
  AUCTION_HOUSE: '0x830BD73E4184ceF73443C15111a1DF14e495C706'.toLowerCase(),
  ZERO_ADDRESS: '0x0000000000000000000000000000000000000000'.toLowerCase(),
  NOUNDER: '0x2573C60a6D127755aA2DC85e342F7da2378a0Cc5'.toLowerCase(),
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'.toLowerCase()
} as const;

// Transaction type identifiers
const TRANSACTION_TYPES = {
  NOUN_TRANSFER: 'NOUN_TRANSFER',
  NOUN_MINT: 'MINT',
  NOUNDER_TRANSFER: 'NOUNDER_TRANSFER',
  USDC_TRANSFER: 'USDC_TRANSFER',
  ETH_TRANSFER: 'ETH_TRANSFER'
} as const;

function getCombinedTransactions(data: TreasuryData): EnhancedTransaction[] {
  // Just combine and sort all transactions, no filtering
  const allTransactions = [
    ...data.ethTransactions,
    ...data.usdcTransactions,
    ...data.nounTransactions
  ];

  // Sort by timestamp, newest first
  return allTransactions.sort((a, b) => parseInt(b.timeStamp) - parseInt(a.timeStamp));
}

function getContractName(address: string): string {
  return MONITORED_CONTRACTS.find(c => 
    c.address.toLowerCase() === address.toLowerCase()
  )?.name || 'Unknown Contract';
}

function safeFormatAmount(value: string | null | undefined, decimals: number): string {
  if (!value || value === '0x' || value === 'null') {
    return '0';
  }
  try {
    return formatUnits(value, decimals);
  } catch (error) {
    console.error('Error formatting amount:', error, { value, decimals });
    return '0';
  }
}

function isBidTransaction(tx: EnhancedTransaction): boolean {
  const BID_METHODS = ['0x96b5a755', '0x4b43ed12'];
  
  // Handle optional methodId
  const hasMatchingMethodId = tx.methodId ? BID_METHODS.includes(tx.methodId) : false;
  
  // Handle optional functionName
  const hasMatchingFunctionName = tx.functionName ? (
    tx.functionName.toLowerCase().includes('createbid') ||
    tx.functionName.toLowerCase().includes('bid')
  ) : false;
  
  return hasMatchingMethodId || hasMatchingFunctionName;
}

function getTransactionType(tx: EnhancedTransaction): typeof TRANSACTION_TYPES[keyof typeof TRANSACTION_TYPES] {
  if ('nounId' in tx) {
    const nounTx = tx as NounTransaction;
    if (nounTx.isNounderNoun) {
      return TRANSACTION_TYPES.NOUNDER_TRANSFER;
    }
    if (nounTx.isMint) {
      return TRANSACTION_TYPES.NOUN_MINT;
    }
    return TRANSACTION_TYPES.NOUN_TRANSFER;
  }
  
  if ('amount' in tx) {
    return TRANSACTION_TYPES.USDC_TRANSFER;
  }
  
  return TRANSACTION_TYPES.ETH_TRANSFER;
}

function getTransactionDisplay(tx: EnhancedTransaction): string {
  // Simple display logic - just show what type of transfer it is
  if (tx.tokenID) {
    return `NOUN #${tx.tokenID}`;
  }
  if (tx.tokenSymbol) {
    return `${tx.tokenSymbol} Transfer`;
  }
  return 'ETH Transfer';
}

function isTransactionSuccessful(tx: EtherscanTransaction): boolean {
  return tx.isError === '0';
}

export function processTransactions(
  rawData: Record<string, any>, 
  query?: { contractTypes?: ('treasury' | 'token_buyer' | 'payer' | 'auction')[] }
): TreasuryData {
  const processedData: TreasuryData = {
    nounTransactions: [],
    usdcTransactions: [],
    ethTransactions: [],
    balances: { eth: '0', usdc: '0' }
  };

  // Filter contracts based on query
  const relevantContracts = query?.contractTypes 
    ? MONITORED_CONTRACTS.filter(c => query.contractTypes?.includes(c.type))
    : MONITORED_CONTRACTS;

  // Process each contract's data
  relevantContracts.forEach(contract => {
    const contractData = rawData[contract.address];
    if (!contractData) return;

    // Add balances
    processedData.balances.eth = addBigInts(
      processedData.balances.eth,
      contractData.balances?.eth || '0'
    );
    processedData.balances.usdc = addBigInts(
      processedData.balances.usdc,
      contractData.balances?.usdc || '0'
    );

    // Process transactions
    const transactions = contractData.transactions || [];
    transactions.forEach((tx: EtherscanTransaction) => {
      const enhancedTx: EnhancedTransaction = {
        ...tx,
        contractAddress: contract.address,
        contractName: contract.name
      };

      // Categorize transaction
      if (tx.tokenID) {
        const nounTx: NounTransaction = {
          ...enhancedTx,
          nounId: tx.tokenID,
          isNounderNoun: tx.from.toLowerCase() === CONTRACTS.NOUNDER.toLowerCase(),
          isMint: tx.from.toLowerCase() === CONTRACTS.ZERO_ADDRESS.toLowerCase()
        };
        processedData.nounTransactions.push(nounTx);
      } else if (tx.tokenSymbol === 'USDC') {
        const usdcTx: USDCTransaction = {
          ...enhancedTx,
          amount: tx.value,
          decimals: 6
        };
        processedData.usdcTransactions.push(usdcTx);
      } else {
        processedData.ethTransactions.push(enhancedTx);
      }
    });
  });

  return processedData;
}

// Helper function for adding big integers stored as strings
function addBigInts(a: string, b: string): string {
  return (BigInt(a || '0') + BigInt(b || '0')).toString();
}

// Export everything at once
export {
  CONTRACTS,
  TRANSACTION_TYPES,
  getCombinedTransactions,
  getContractName,
  safeFormatAmount,
  isBidTransaction,
  getTransactionDisplay,
  isTransactionSuccessful
}; 