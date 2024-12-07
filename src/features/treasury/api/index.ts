import { NextApiRequest, NextApiResponse } from 'next';
import { Database } from '../../../lib/db/index';
import { getMonitoredContracts, ContractConfig } from '../types/contracts';
import { formatContractSummary } from '../lib/format';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get monitored contracts
    const contracts = await getMonitoredContracts();

    // Get all contracts from database
    const contractsData = await Promise.all(
      contracts.map(async (contract: ContractConfig) => {
        const data = await Database.getContract(contract.address);
        if (!data) {
          return {
            address: contract.address,
            name: contract.name,
            type: contract.type,
            balance: '0',
            tokenHoldings: [],
            nftHoldings: [],
            lastSync: new Date(),
            metadata: {
              lastSyncTime: 0,
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
        }
        return data;
      })
    );

    // Get sync status for all contracts
    const syncStatus = await Promise.all(
      contracts.map(async (contract: ContractConfig) => {
        const status = await Database.getSyncStatus(contract.address);
        return {
          address: contract.address,
          status
        };
      })
    );

    // Calculate summary
    const summary = formatContractSummary(contractsData);

    return res.status(200).json({
      contracts: contractsData,
      syncStatus,
      summary
    });
  } catch (error) {
    console.error('Error in treasury handler:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 