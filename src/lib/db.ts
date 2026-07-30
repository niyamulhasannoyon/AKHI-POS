import { neon, Pool } from '@neondatabase/serverless';

// Neon HTTP query client for fast serverless queries
export function getDbSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is missing. Please set it in Vercel or .env.local');
  }
  return neon(connectionString);
}

// Serverless Pool singleton instance caching for transactions / bulk operations
let poolInstance: Pool | null = null;

export function getDbPool(): Pool {
  if (!poolInstance) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is missing. Please set it in Vercel or .env.local');
    }
    poolInstance = new Pool({ connectionString });
  }
  return poolInstance;
}
