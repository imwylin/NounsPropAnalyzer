import { useMemo } from 'react';
import { CONTRACTS, getContractName } from '../utils/transactions';
import { 
  RawTreasuryData,
  TreasuryData, 
  Transaction,
  TransactionQuery,
  NounTransaction,
  USDCTransaction,
  EnhancedTransaction
} from '../utils/types';
import { MONITORED_CONTRACTS } from '../utils/contracts';

export function useTreasuryData(
  rawData: RawTreasuryData,
  query?: TransactionQuery
) {
  return useMemo(() => {
    const processedData: TreasuryData = {
      nounTransactions: [],
      usdcTransactions: [],
      ethTransactions: [],
      balances: { eth: '0', usdc: '0' }
    };

    if (!rawData) return processedData;

    const relevantContracts = query?.contractTypes 
      ? MONITORED_CONTRACTS.filter(c => query.contractTypes?.includes(c.type))
      : MONITORED_CONTRACTS;

    relevantContracts.forEach(contract => {
      const contractData = rawData[contract.address];
      if (!contractData) return;

      contractData.transactions.forEach((tx: Transaction) => {
        const enhancedTx: EnhancedTransaction = {
          ...tx,
          contractAddress: contract.address,
          contractName: getContractName(contract.address)
        };

        if (shouldProcessTransaction(tx, query)) {
          categorizeTransaction(enhancedTx, processedData);
        }
      });

      // Aggregate balances
      processedData.balances.eth = addBigInts(
        processedData.balances.eth,
        contractData.balances.eth
      );
      processedData.balances.usdc = addBigInts(
        processedData.balances.usdc,
        contractData.balances.usdc
      );
    });

    // Sort transactions by timestamp within their categories
    processedData.ethTransactions.sort((a, b) => 
      parseInt(b.timeStamp) - parseInt(a.timeStamp)
    );
    processedData.usdcTransactions.sort((a, b) => 
      parseInt(b.timeStamp) - parseInt(a.timeStamp)
    );
    processedData.nounTransactions.sort((a, b) => 
      parseInt(b.timeStamp) - parseInt(a.timeStamp)
    );

    return processedData;
  }, [rawData, query]);
}

function shouldProcessTransaction(tx: Transaction, query?: TransactionQuery): boolean {
  // Only filter by contract type, no other filtering
  return true;
}

function categorizeTransaction(tx: EnhancedTransaction, data: TreasuryData): void {
  console.log('Raw transaction:', tx);
  console.log('Categorizing transaction:', {
    tokenSymbol: tx.tokenSymbol,
    tokenID: tx.tokenID,
    value: tx.value,
    contractName: tx.contractName
  });

  if (tx.tokenID) {
    const nounTx: NounTransaction = {
      ...tx,
      nounId: tx.tokenID
    };
    data.nounTransactions.push(nounTx);
  }
  else if (tx.tokenSymbol === 'USDC') {
    const usdcTx: USDCTransaction = {
      ...tx,
      amount: tx.value,
      decimals: 6
    };
    data.usdcTransactions.push(usdcTx);
  }
  else {
    data.ethTransactions.push(tx);
  }
}

function addBigInts(a: string, b: string): string {
  return (BigInt(a || '0') + BigInt(b || '0')).toString();
} 