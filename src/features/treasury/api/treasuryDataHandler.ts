import { getMonitoredContracts } from '../types/contracts';
import type { Contract, SyncStatus } from '../../../lib/types';
import type { 
  Transaction, 
  InternalTransaction, 
  ERC20Transfer, 
  ERC721Transfer, 
  ERC1155Transfer,
  BaseTransaction 
} from '../types/etherscan';
import { Database } from '../../../lib/db/index';
import { getContractTransactions } from '../lib/queries';

export interface TreasuryAPIResponse {
  contracts: (Contract & { 
    syncStatus: SyncStatus | null;
    transactions: {
      normal: Transaction[];
      internal: InternalTransaction[];
      erc20: ERC20Transfer[];
      erc721: ERC721Transfer[];
      erc1155: ERC1155Transfer[];
    };
  })[];
  lastSync: number;
  error: string | null;
}

export async function getTreasuryData(
  page: number = 1,
  pageSize: number = 50
): Promise<TreasuryAPIResponse> {
  try {
    const response: TreasuryAPIResponse = {
      contracts: [],
      lastSync: Date.now(),
      error: null
    };

    // Get monitored contracts
    const contracts = await getMonitoredContracts();

    // Process each contract
    for (const contract of contracts) {
      try {
        // Get contract data and sync status
        const [contractData, syncStatus] = await Promise.all([
          Database.getContract(contract.address),
          Database.getSyncStatus(contract.address)
        ]);

        if (contractData) {
          // Get transactions with pagination
          const { transactions } = await getContractTransactions(
            contract.address,
            page,
            pageSize
          );

          // Group transactions by type
          const groupedTransactions = {
            normal: transactions.filter((tx: BaseTransaction) => tx.type === 'normal') as Transaction[],
            internal: transactions.filter((tx: BaseTransaction) => tx.type === 'internal') as InternalTransaction[],
            erc20: transactions.filter((tx: BaseTransaction) => tx.type === 'erc20') as ERC20Transfer[],
            erc721: transactions.filter((tx: BaseTransaction) => tx.type === 'erc721') as ERC721Transfer[],
            erc1155: transactions.filter((tx: BaseTransaction) => tx.type === 'erc1155') as ERC1155Transfer[]
          };

          response.contracts.push({
            ...contractData,
            transactions: groupedTransactions,
            syncStatus: syncStatus || {
              contractAddress: contract.address,
              inProgress: false,
              stage: 'idle',
              progress: 0,
              lastSync: null,
              error: null,
              lastSyncedBlock: null
            }
          });
        } else {
          // If no data, initialize contract
          await Database.updateContract(contract.address, {
            address: contract.address,
            name: contract.name,
            type: contract.type,
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
          });
          
          response.contracts.push({
            address: contract.address,
            name: contract.name,
            type: contract.type,
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
            },
            transactions: {
              normal: [],
              internal: [],
              erc20: [],
              erc721: [],
              erc1155: []
            },
            syncStatus: {
              contractAddress: contract.address,
              inProgress: false,
              stage: 'idle',
              progress: 0,
              lastSync: null,
              error: null,
              lastSyncedBlock: null
            }
          });
        }
      } catch (error) {
        console.error(`Error processing contract ${contract.address}:`, error);
      }
    }

    return response;
  } catch (error) {
    console.error('Error in getTreasuryData:', error);
    return {
      contracts: [],
      lastSync: Date.now(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 