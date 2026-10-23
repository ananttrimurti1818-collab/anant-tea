import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import postgres from 'postgres';

function loadEnvFile(text) {
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    let value = rawValue.trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    process.env[key] = value;
  }
}

const envPath = path.join(process.cwd(), '.env');
try { loadEnvFile(await fs.readFile(envPath, 'utf8')); } catch {}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is missing. Add it to .env or your environment.');
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { max: 1, connect_timeout: 15, idle_timeout: 5, onnotice: () => {} });

try {
  console.log('Connecting to Neon PostgreSQL (READ-ONLY AUDIT)...');
  await sql`select 1`;
  console.log('Database connection successful.');
  console.log('\n=== TABLES & ROW COUNTS ===');

  const tables = await sql`
    select table_name
    from information_schema.tables
    where table_schema = 'public' and table_type = 'BASE TABLE'
    order by table_name
  `;

  for (const { table_name } of tables) {
    const [{ count }] = await sql.unsafe(`select count(*)::bigint as count from public.${sql(table_name)}`);
    console.log(`${table_name}: ${count}`);
  }

  console.log('\n=== COLUMNS ===');
  const columns = await sql`
    select table_name, ordinal_position, column_name, data_type, is_nullable, column_default
    from information_schema.columns
    where table_schema = 'public'
    order by table_name, ordinal_position
  `;
  let current = '';
  for (const c of columns) {
    if (c.table_name !== current) {
      current = c.table_name;
      console.log(`\n[${current}]`);
    }
    console.log(`  ${c.column_name} | ${c.data_type} | nullable=${c.is_nullable} | default=${c.column_default ?? '-'}`);
  }

  console.log('\n=== PRIMARY KEYS ===');
  const pks = await sql`
    select tc.table_name, kcu.column_name
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
    where tc.table_schema = 'public' and tc.constraint_type = 'PRIMARY KEY'
    order by tc.table_name, kcu.ordinal_position
  `;
  for (const r of pks) console.log(`${r.table_name}: ${r.column_name}`);

  console.log('\n=== FOREIGN KEYS ===');
  const fks = await sql`
    select
      tc.table_name,
      kcu.column_name,
      ccu.table_name as foreign_table_name,
      ccu.column_name as foreign_column_name
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
    join information_schema.constraint_column_usage ccu
      on tc.constraint_name = ccu.constraint_name and tc.table_schema = ccu.table_schema
    where tc.table_schema = 'public' and tc.constraint_type = 'FOREIGN KEY'
    order by tc.table_name, kcu.column_name
  `;
  for (const r of fks) console.log(`${r.table_name}.${r.column_name} -> ${r.foreign_table_name}.${r.foreign_column_name}`);

  console.log('\n=== LIKELY LEGACY / NEW SCHEMA COMPARISON ===');
  const pairs = [
    ['Admin', 'admin'], ['BlogPost', 'blog_posts'], ['Category', 'categories'], ['Coupon', 'coupons'],
    ['Customer', 'customers'], ['GalleryCategory', 'gallery_categories'], ['GalleryImage', 'gallery_images'],
    ['Order', 'orders'], ['OrderItem', 'order_items'], ['Product', 'products'],
    ['ProductImage', 'product_images'], ['ProductVariant', 'product_variants']
  ];
  const tableSet = new Set(tables.map(t => t.table_name));
  for (const [legacy, modern] of pairs) {
    if (!tableSet.has(legacy) && !tableSet.has(modern)) continue;
    let a = 'missing', b = 'missing';
    if (tableSet.has(legacy)) a = String((await sql.unsafe(`select count(*)::bigint as count from public.${legacy}`))[0].count);
    if (tableSet.has(modern)) b = String((await sql.unsafe(`select count(*)::bigint as count from public.${modern}`))[0].count);
    console.log(`${legacy}=${a} | ${modern}=${b}`);
  }

  console.log('\nAUDIT COMPLETE. No INSERT, UPDATE, DELETE, DROP, ALTER, or TRUNCATE operations were performed.');
} catch (error) {
  console.error('Database audit failed.');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
