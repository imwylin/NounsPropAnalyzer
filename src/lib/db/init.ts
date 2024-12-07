import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon, neonConfig } from '@neondatabase/serverless';

// Configure Neon connection management
neonConfig.wsProxy = (host, port) => `wss://${host}:${port}`;
neonConfig.pipelineConnect = "password";
neonConfig.useSecureWebSocket = true;

// Get unpooled database URL from various possible environment variables
const getUnpooledDatabaseUrl = () => {
  const possibleEnvVars = [
    process.env.DATABASE_URL_UNPOOLED,
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.DATABASE_URL // Fallback to pooled URL if necessary
  ];

  const databaseUrl = possibleEnvVars.find(url => url && url.length > 0);

  if (!databaseUrl) {
    throw new Error('No database connection URL found in environment variables. Please check your .env files.');
  }

  return databaseUrl;
};

export async function initializeDatabase() {
  // Use non-pooling connection for schema operations
  const client = neon(getUnpooledDatabaseUrl());
  const db = drizzle(client);

  try {
    console.log('Initializing database...');

    // Drop existing tables in correct order
    await db.execute(sql`DROP TABLE IF EXISTS transactions CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS sync_status CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS contracts CASCADE`);

    // Create contracts table first since it's referenced by others
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS contracts (
        address TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        balance TEXT NOT NULL,
        token_holdings JSONB NOT NULL,
        nft_holdings JSONB NOT NULL,
        last_sync TIMESTAMPTZ NOT NULL,
        metadata JSONB NOT NULL
      )
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS contracts_last_sync_idx ON contracts (last_sync)
    `);

    // Create sync_status table with foreign key to contracts
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sync_status (
        contract_address TEXT PRIMARY KEY REFERENCES contracts (address) ON DELETE CASCADE,
        in_progress BOOLEAN NOT NULL,
        stage TEXT NOT NULL,
        progress INTEGER NOT NULL,
        last_sync TIMESTAMPTZ,
        error TEXT,
        last_synced_block TEXT
      )
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS sync_status_in_progress_idx ON sync_status (in_progress)
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS sync_status_last_sync_idx ON sync_status (last_sync)
    `);

    // Create transactions table with foreign key to contracts
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS transactions (
        hash TEXT PRIMARY KEY,
        contract_address TEXT NOT NULL REFERENCES contracts (address) ON DELETE CASCADE,
        block_number TEXT NOT NULL,
        time_stamp TEXT NOT NULL,
        "from" TEXT NOT NULL,
        "to" TEXT NOT NULL,
        value TEXT NOT NULL,
        type TEXT NOT NULL,
        gas TEXT,
        gas_price TEXT,
        gas_used TEXT,
        input TEXT NOT NULL,
        is_error TEXT,
        txreceipt_status TEXT,
        method_id TEXT,
        function_name TEXT,
        nonce TEXT,
        token_symbol TEXT,
        token_name TEXT,
        token_decimal TEXT,
        token_value TEXT,
        token_id TEXT
      )
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS transactions_contract_address_idx 
      ON transactions (contract_address)
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS transactions_timestamp_idx 
      ON transactions (time_stamp)
    `);

    // Clean up any empty contracts
    await db.execute(sql`
      DELETE FROM contracts 
      WHERE address = '' 
      OR name = '' 
      OR type = 'contract'
    `);

    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
} 