import { readFileSync } from "node:fs";
import pg from "pg";

const games = JSON.parse(readFileSync(new URL("./seed-games.json", import.meta.url), "utf8"));

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  const result = await client.query(
    "INSERT INTO games SELECT * FROM json_populate_recordset(null::games, $1) ON CONFLICT (id) DO NOTHING",
    [JSON.stringify(games)],
  );
  console.log(`games seeded: ${result.rowCount} new of ${games.length}`);
} finally {
  await client.end();
}
