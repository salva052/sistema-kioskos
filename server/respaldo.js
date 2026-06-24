const mysql = require('mysql2/promise');
const fs = require('fs');

const URL = 'mysql://root:WvxZJBSTkwasFScdhLzfbZlXOFAdsRrp@thomas.proxy.rlwy.net:23751/railway';

async function main() {
  const conn = await mysql.createConnection(URL);
  console.log('Conectado...');

  let sql = '-- ============================================================\n';
  sql += "-- Sistema Kiosko's — Respaldo de base de datos\n";
  sql += '-- Fecha: ' + new Date().toLocaleString('es-MX') + '\n';
  sql += '-- ============================================================\n\n';
  sql += 'SET FOREIGN_KEY_CHECKS=0;\n\n';

  const [tablas] = await conn.query('SHOW TABLES');
  const nombres = tablas.map(t => Object.values(t)[0]);
  console.log('Tablas:', nombres.join(', '));

  for (const tabla of nombres) {
    sql += '-- Tabla: ' + tabla + '\n';
    const [[create]] = await conn.query('SHOW CREATE TABLE ' + tabla);
    const createSql = Object.values(create)[1];
    sql += 'DROP TABLE IF EXISTS ' + tabla + ';\n';
    sql += createSql + ';\n\n';

    const [rows] = await conn.query('SELECT * FROM ' + tabla);
    if (rows.length > 0) {
      const cols = Object.keys(rows[0]);
      sql += 'INSERT INTO ' + tabla + ' (' + cols.join(', ') + ') VALUES\n';
      const vals = rows.map(row => {
        const v = cols.map(c => {
          const val = row[c];
          if (val === null) return 'NULL';
          if (typeof val === 'number') return val;
          if (val instanceof Date) return "'" + val.toISOString().slice(0,19).replace('T',' ') + "'";
          return "'" + String(val).replace(/'/g, "''") + "'";
        });
        return '(' + v.join(', ') + ')';
      });
      sql += vals.join(',\n') + ';\n\n';
    } else {
      sql += '-- (sin registros)\n\n';
    }
  }

  sql += 'SET FOREIGN_KEY_CHECKS=1;\n';
  fs.writeFileSync('respaldo_kioskos.sql', sql);
  console.log('Listo: respaldo_kioskos.sql');
  await conn.end();
}
main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });