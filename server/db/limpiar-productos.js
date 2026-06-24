require('dotenv').config();
const mysql = require('mysql2/promise');

// Limpia los productos precargados del seed original.
// Deja intactos: usuarios, clientes, cuentas, pedidos, cobros y gastos.
// Corre con: node db/limpiar-productos.js

const URL = process.env.MYSQL_URL ||
  'mysql://root:WvxZJBSTkwasFScdhLzfbZlXOFAdsRrp@thomas.proxy.rlwy.net:23751/railway';

async function main() {
  const conn = await mysql.createConnection(URL);
  console.log('Conectado...');

  const [antes] = await conn.execute('SELECT COUNT(*) AS n FROM productos');
  console.log(`Productos antes: ${antes[0].n}`);

  // Solo elimina los productos del seed original que no tengan pedidos asociados
  await conn.execute(`
    DELETE FROM productos
    WHERE nombre IN ('Manzana','Aguacate','Jitomate','Platano','Chile serrano','Ensalada italiana')
    AND id NOT IN (SELECT DISTINCT producto_id FROM detalle_pedido)
  `);

  const [despues] = await conn.execute('SELECT COUNT(*) AS n FROM productos');
  console.log(`Productos después: ${despues[0].n}`);
  console.log('Listo. Los productos del seed fueron eliminados.');
  console.log('Ahora Christian puede agregar los suyos desde Precios del día.');

  await conn.end();
}
main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
