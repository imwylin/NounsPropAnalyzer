import { NextApiRequest, NextApiResponse } from 'next';
import { Storage } from '../../../../features/treasury/lib/storage';
import { getContractTransactions } from '../../../../features/treasury/lib/queries';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { address, page = '1', pageSize = '50', startTime, endTime } = req.query;

  if (!address || typeof address !== 'string') {
    return res.status(400).json({ error: 'Address is required' });
  }

  try {
    console.log('Received request:', {
      address,
      page,
      pageSize,
      startTime,
      endTime
    });

    // Get contract data
    const contractData = await Storage.getContractData(address);
    if (!contractData) {
      console.log(`Contract not found: ${address}`);
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Parse pagination params
    const pageNum = Math.max(1, parseInt(page as string));
    const pageSizeNum = parseInt(pageSize as string);

    // Parse time range if provided
    const timeRange = startTime || endTime ? {
      start: startTime ? parseInt(startTime as string) : undefined,
      end: endTime ? parseInt(endTime as string) : undefined
    } : undefined;

    console.log('Fetching transactions with params:', {
      address,
      pageNum,
      pageSizeNum,
      timeRange
    });

    // Get transactions with pagination
    const result = await getContractTransactions(address, pageNum, pageSizeNum, timeRange);

    console.log('Successfully fetched transactions:', {
      transactionCount: result.transactions.length,
      pagination: result.pagination
    });

    return res.status(200).json({
      transactions: result.transactions,
      pagination: {
        page: result.pagination.page,
        pageSize: pageSizeNum,
        total: result.pagination.total,
        totalPages: result.pagination.totalPages
      }
    });
  } catch (error) {
    console.error('Error getting contract transactions:', error);
    // Return more detailed error information
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.stack : undefined : undefined
    });
  }
} 