// Run this from your backend folder: node check-db-encoding.js
// Reports the actual on-disk encoding of every database on this
// Postgres server, using the same DATABASE_URL your app already uses.
// No psql required.
require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const res = await client.query(
    `SELECT datname, pg_encoding_to_char(encoding) AS encoding
     FROM pg_database
     ORDER BY datname;`
  );
  console.log('\nDatabases on this Postgres server:');
  console.table(res.rows);

  const url = new URL(process.env.DATABASE_URL.replace('postgresql://', 'postgres://'));
  const currentDb = url.pathname.replace('/', '');
  const current = res.rows.find((r) => r.datname === currentDb);

  console.log(`\nYour app connects to: "${currentDb}"`);
  if (current) {
    console.log(`Its actual encoding is: ${current.encoding}`);
    if (current.encoding !== 'UTF8') {
      console.log(
        `\n>>> THIS IS THE BUG. "${currentDb}" was created with ${current.encoding} encoding, ` +
        `not UTF8. This cannot be changed in place -- the database must be dropped and ` +
        `recreated with ENCODING 'UTF8'. See recreate-db-utf8.js.`
      );
    } else {
      console.log('\nThis database is already UTF8 -- the encoding problem is coming from somewhere else. Send me this output.');
    }
  } else {
    console.log('Could not find that database in pg_database -- double check DATABASE_URL.');
  }

  await client.end();
}

main().catch((err) => {
  console.error('Could not check encoding:', err.message);
  process.exit(1);
});
