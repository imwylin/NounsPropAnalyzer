import { NextApiRequest, NextApiResponse } from 'next';
import { Database } from '../../../../lib/db';
import { getContractByAddress } from '../../../../features/treasury/types/contracts';
import type { Contract, SyncStatus } from '../../../../lib/types';

interface ContractResponse {
  data: Contract | null;
  syncStatus: SyncStatus | null;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ContractResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      data: null,
      syncStatus: null,
      error: 'Method not allowed'
    });
  }

  const { address } = req.query;
  if (!address || typeof address !== 'string') {
    return res.status(400).json({
      data: null,
      syncStatus: null,
      error: 'Address is required'
    });
  }

  const contract = getContractByAddress(address);
  if (!contract) {
    return res.status(404).json({
      data: null,
      syncStatus: null,
      error: 'Contract not found'
    });
  }

  try {
    // Get contract data and sync status
    const [data, syncStatus] = await Promise.all([
      Database.getContract(address),
      Database.getSyncStatus(address)
    ]);

    // If contract doesn't exist, initialize it
    if (!data) {
      const initialData = {
        address,
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
      };

      await Database.updateContract(address, initialData);

      if (!syncStatus) {
        await Database.updateSyncStatus(address, {
          contractAddress: address,
          inProgress: false,
          stage: 'idle',
          progress: 0,
          lastSync: new Date(),
          error: null,
          lastSyncedBlock: null
        });
      }

      return res.status(200).json({
        data: initialData,
        syncStatus
      });
    }

    return res.status(200).json({ data, syncStatus });
  } catch (error) {
    console.error('Error fetching contract data:', error);
    return res.status(500).json({
      data: null,
      syncStatus: null,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
} 