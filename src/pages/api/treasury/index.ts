import { NextApiRequest, NextApiResponse } from 'next';
import { Database } from '../../../lib/db';
import { MONITORED_CONTRACTS } from '../../../features/treasury/types/contracts';
import type { APIResponse, Contract } from '../../../lib/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse>
) {
  try {
    // Get all contracts data in parallel
    const contractsData = await Promise.all(
      Object.values(MONITORED_CONTRACTS).map(async (contract) => {
        const [data, syncStatus] = await Promise.all([
          Database.getContract(contract.address),
          Database.getSyncStatus(contract.address)
        ]);

        // Initialize contract data if it doesn't exist
        if (!data) {
          const initialData: Contract = {
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
            syncStatus: syncStatus || undefined
          };
          
          await Database.updateContract(contract.address, initialData);
          
          if (!syncStatus) {
            await Database.updateSyncStatus(contract.address, {
              contractAddress: contract.address,
              inProgress: false,
              stage: 'idle',
              progress: 0,
              lastSync: new Date(),
              error: null,
              lastSyncedBlock: null
            });
          }

          return initialData;
        }

        return {
          ...data,
          syncStatus: syncStatus || undefined
        };
      })
    );

    // Get the most recent sync time
    const lastSync = Math.max(
      ...contractsData.map(c => c.lastSync?.getTime() || 0)
    );

    res.status(200).json({
      contracts: contractsData,
      lastSync,
      error: null
    });
  } catch (error) {
    console.error('Error in treasury API:', error);
    res.status(500).json({
      contracts: [],
      lastSync: Date.now(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 