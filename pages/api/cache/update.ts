import { NextApiRequest, NextApiResponse } from 'next';
import { getContractTransactions, getContractBalances } from '../../../utils/etherscan';
import { MONITORED_CONTRACTS } from '../../../utils/contracts';
import { CachedData } from '../../../utils/types';

async function updateEdgeConfig(items: Record<string, string>) {
  const response = await fetch('https://edge-config.vercel.com/v1/items', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.EDGE_CONFIG}`,
    },
    body: JSON.stringify({ items }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update Edge Config: ${await response.text()}`);
  }

  return response.json();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const updates: Record<string, string> = {};

    // Fetch and cache treasury data
    const treasuryContracts = MONITORED_CONTRACTS.filter(c => 
      ['treasury', 'token_buyer', 'payer'].includes(c.type)
    );

    for (const contract of treasuryContracts) {
      const [transactions, balances] = await Promise.all([
        getContractTransactions(contract.address, 'all'),
        getContractBalances(contract.address)
      ]);

      const data: CachedData = {
        transactions,
        balances,
        contractType: contract.type,
        contractName: contract.name,
        lastUpdated: Date.now()
      };

      const cacheKey = `treasury:${contract.address}:all`;
      updates[cacheKey] = JSON.stringify(data);
    }

    // Fetch and cache auction data
    const auctionContracts = MONITORED_CONTRACTS.filter(c => 
      c.type === 'auction'
    );

    for (const contract of auctionContracts) {
      const [transactions, balances] = await Promise.all([
        getContractTransactions(contract.address, 'all'),
        getContractBalances(contract.address)
      ]);

      const data: CachedData = {
        transactions,
        balances,
        contractType: contract.type,
        contractName: contract.name,
        lastUpdated: Date.now()
      };

      const cacheKey = `auction:${contract.address}:all`;
      updates[cacheKey] = JSON.stringify(data);
    }

    // Update Edge Config with all the data at once
    await updateEdgeConfig(updates);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Cache update failed:', error);
    res.status(500).json({ error: 'Failed to update cache' });
  }
} 