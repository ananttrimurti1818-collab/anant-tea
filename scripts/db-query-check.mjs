import process from 'node:process';
import postgres from 'postgres';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is missing. Put it in .env before running this command.');
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { max: 1, connect_timeout: 15, idle_timeout: 5 });
try {
  const [{ count }] = await sql`select count(*)::bigint as count from "Product" where "isActive" = true`;
  console.log(`Active products: ${count}`);
} finally {
  await sql.end({ timeout: 5 });
}
