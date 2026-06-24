const mysql = require('mysql2/promise');
const fs = require('fs');

const URL = 'mysql://root:WvxZJBSTkwasFScdhLzfbZlXOFAdsRrp@thomas.proxy.rlwy.net:23751/railway';

async function main() {
  const conn = await mysql.createConnection(URL + '?multipleStatements=true');
  console.log('Conectado a Railway.');
  let schema = fs.readFileSync('db/schema.sql', 'utf8');
  schema = schema.replace(/CREATE DATABASE[\s\S]*?USE fruteria_os;/, '');
  await conn.query(schema);
  const [t] = await conn.query('SHOW TABLES');
  console.log('Tablas creadas:', t.map(x => Object.values(x)[0]).join(', '));
  await conn.end();
}
main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });