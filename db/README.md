# Anant Tea database

The production database is PostgreSQL on Neon.

## Configure

Create `.env` in the project root and set `DATABASE_URL` to your Neon connection string. Keep `.env` private; it is ignored by Git.

## Run migrations

After installing dependencies, run:

```bash
npm run db:migrate
```

The migration runner:
- connects to Neon using `DATABASE_URL`;
- creates a `schema_migrations` table;
- applies SQL files from `db/migrations` in filename order;
- skips migrations already recorded as applied;
- runs each migration transactionally.

The initial schema is `db/migrations/001_initial_schema.sql`.
