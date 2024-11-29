import { NextApiRequest, NextApiResponse } from 'next';
import { getContractTransactions, getContractBalances } from '../../../utils/etherscan';
import { MONITORED_CONTRACTS } from '../../../utils/contracts';
import { CachedData } from '../../../utils/types';
import { setTimeout } from 'timers/promises';

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

  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.CACHE_UPDATE_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('Starting cache update...', {
      nodeEnv: process.env.NODE_ENV,
      etherscanKey: process.env.ETHERSCAN_API_KEY ? 'Present' : 'Missing',
      edgeConfig: process.env.EDGE_CONFIG ? 'Present' : 'Missing'
    });

    const MAX_EDGE_CONFIG_SIZE = 900 * 1024; // 900KB limit for Edge Config
    
    const updates: Record<string, string> = {};

    // Fetch and cache treasury data
    const treasuryContracts = MONITORED_CONTRACTS.filter(c => 
      ['treasury', 'token_buyer', 'payer'].includes(c.type)
    );

    console.log('Treasury contracts:', treasuryContracts.map(c => ({
      name: c.name,
      address: c.address,
      type: c.type
    })));

    for (const contract of treasuryContracts) {
      console.log(`Processing treasury contract: ${contract.name} (${contract.address})`);
      try {
        await setTimeout(200); // 200ms delay between requests
        
        const [transactions, balances] = await Promise.all([
          getContractTransactions(contract.address, 'all'),
          getContractBalances(contract.address)
        ]);

        if (!Array.isArray(transactions)) {
          throw new Error(`Invalid transactions data for ${contract.name}`);
        }

        if (typeof balances !== 'object') {
          throw new Error(`Invalid balances data for ${contract.name}`);
        }

        console.log(`Data fetched for ${contract.name}:`, {
          transactionsCount: transactions.length,
          balancesCount: Object.keys(balances).length
        });

        const data: CachedData = {
          transactions,
          balances,
          contractType: contract.type,
          contractName: contract.name,
          lastUpdated: Date.now()
        };

        const cacheKey = `treasury:${contract.address}:all`;
        updates[cacheKey] = JSON.stringify(data);
      } catch (contractError) {
        console.error(`Error processing ${contract.name}:`, contractError);
      }
    }

    // Fetch and cache auction data
    const auctionContracts = MONITORED_CONTRACTS.filter(c => 
      c.type === 'auction'
    );

    console.log('Auction contracts:', auctionContracts.map(c => ({
      name: c.name,
      address: c.address
    })));

    for (const contract of auctionContracts) {
      console.log(`Processing auction contract: ${contract.name} (${contract.address})`);
      try {
        await setTimeout(200); // 200ms delay between requests
        
        const [transactions, balances] = await Promise.all([
          getContractTransactions(contract.address, 'all'),
          getContractBalances(contract.address)
        ]);

        if (!Array.isArray(transactions)) {
          throw new Error(`Invalid transactions data for ${contract.name}`);
        }

        if (typeof balances !== 'object') {
          throw new Error(`Invalid balances data for ${contract.name}`);
        }

        console.log(`Data fetched for ${contract.name}:`, {
          transactionsCount: transactions.length,
          balancesCount: Object.keys(balances).length
        });

        const data: CachedData = {
          transactions,
          balances,
          contractType: contract.type,
          contractName: contract.name,
          lastUpdated: Date.now()
        };

        const cacheKey = `auction:${contract.address}:all`;
        updates[cacheKey] = JSON.stringify(data);
      } catch (contractError) {
        console.error(`Error processing ${contract.name}:`, contractError);
      }
    }

    // Log the final updates
    console.log('Final updates summary:', {
      totalUpdates: Object.keys(updates).length,
      keys: Object.keys(updates),
      dataSize: JSON.stringify(updates).length
    });
    
    // Before updating Edge Config, check total size
    const totalSize = JSON.stringify(updates).length;
    if (totalSize > MAX_EDGE_CONFIG_SIZE) {
      throw new Error(`Update size (${totalSize} bytes) exceeds Edge Config limit of ${MAX_EDGE_CONFIG_SIZE} bytes`);
    }

    // Update Edge Config with all the data at once
    const result = await updateEdgeConfig(updates);
    console.log('Edge Config update completed:', result);

    res.status(200).json({ 
      success: true, 
      updates: Object.keys(updates),
      environment: process.env.NODE_ENV
    });
  } catch (error: unknown) {
    console.error('Cache update failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    if (error instanceof Error) {
      res.status(500).json({ 
        error: 'Failed to update cache', 
        details: error.message,
        environment: process.env.NODE_ENV
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to update cache', 
        details: 'Unknown error',
        environment: process.env.NODE_ENV
      });
    }
  }
} 