import { NextApiRequest, NextApiResponse } from 'next';
import { neon, neonConfig } from '@neondatabase/serverless';

// Configure Neon connection management
neonConfig.wsProxy = (host, port) => `wss://${host}:${port}`;
neonConfig.pipelineConnect = "password";
neonConfig.useSecureWebSocket = true;

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Drop tables in reverse order of dependencies
    await sql`DROP TABLE IF EXISTS sync_status`;
    await sql`DROP TABLE IF EXISTS transaction_chunks`;
    await sql`DROP TABLE IF EXISTS contracts`;

    // Create tables in correct order
    await sql`
      CREATE TABLE contracts (
        address TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        last_sync TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE transaction_chunks (
        address TEXT REFERENCES contracts(address),
        chunk_number INTEGER,
        data JSONB NOT NULL,
        block_range JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (address, chunk_number)
      )
    `;

    await sql`
      CREATE TABLE sync_status (
        address TEXT PRIMARY KEY REFERENCES contracts(address),
        status JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;

    return res.status(200).json({ 
      message: 'Database tables reset successfully'
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
} 