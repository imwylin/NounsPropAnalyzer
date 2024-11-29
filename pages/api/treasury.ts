import type { NextApiRequest, NextApiResponse } from 'next';
import { getContractTransactions, getContractBalances } from '../../utils/etherscan';
import { MONITORED_CONTRACTS } from '../../utils/contracts';
import { RawTreasuryData } from '../../utils/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const treasuryData: RawTreasuryData = {};

    // Process each contract in parallel
    await Promise.all(
      MONITORED_CONTRACTS.map(async (contract) => {
        const [transactions, balances] = await Promise.all([
          getContractTransactions(contract.address),
          getContractBalances(contract.address)
        ]);

        treasuryData[contract.address] = {
          transactions,
          balances,
          contractName: contract.name,
          contractType: contract.type,
          lastUpdated: Date.now()
        };
      })
    );

    res.status(200).json(treasuryData);
  } catch (error) {
    console.error('Error fetching treasury data:', error);
    res.status(500).json({ error: 'Failed to fetch treasury data' });
  }
} 