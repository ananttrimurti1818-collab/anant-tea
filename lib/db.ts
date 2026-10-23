import postgres from "postgres";

let client: ReturnType<typeof postgres> | undefined;

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not configured.");
  }
  return url;
}

export function db() {
  if (!client) {
    client = postgres(getDatabaseUrl(), {
      max: 5,
      connect_timeout: 15,
      idle_timeout: 20,
      prepare: false,
    });
  }
  return client;
}

export async function closeDb() {
  if (client) {
    await client.end({ timeout: 5 });
    client = undefined;
  }
}
