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
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

const envPath = path.join(process.cwd(), '.env');
try {
  loadEnvFile(await fs.readFile(envPath, 'utf8'));
} catch {
  // Environment variables may already be supplied by the shell/hosting platform.
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is missing. Add it to .env or your environment.');
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, {
  max: 1,
  connect_timeout: 15,
  idle_timeout: 5,
  onnotice: () => {},
});

try {
  console.log('Connecting to Neon PostgreSQL...');
  await sql`select 1`;
  console.log('Database connection successful.');

  await sql`
    create table if not exists schema_migrations (
      id serial primary key,
      name varchar(255) not null unique,
      applied_at timestamptz not null default now()
    )
  `;

  const migrationDir = path.join(process.cwd(), 'db', 'migrations');
  const files = (await fs.readdir(migrationDir))
    .filter((file) => file.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('No SQL migrations found.');
    process.exit(0);
  }

  const applied = await sql`select name from schema_migrations order by name`;
  const appliedNames = new Set(applied.map((row) => row.name));

  for (const file of files) {
    if (appliedNames.has(file)) {
      console.log(`Skipping ${file} (already applied).`);
      continue;
    }

    const migration = await fs.readFile(path.join(migrationDir, file), 'utf8');
    console.log(`Applying ${file}...`);

    await sql.begin(async (tx) => {
      await tx.unsafe(migration);
      await tx`insert into schema_migrations (name) values (${file})`;
    });

    console.log(`Applied ${file}.`);
  }

  const tables = await sql`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_type = 'BASE TABLE'
    order by table_name
  `;

  console.log(`Migration complete. Public tables: ${tables.length}`);
  console.log(tables.map((row) => `  - ${row.table_name}`).join('\n'));
} catch (error) {
  console.error('Database migration failed.');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
