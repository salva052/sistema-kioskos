const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

const URL = 'mysql://root:WvxZJBSTkwasFScdhLzfbZlXOFAdsRrp@thomas.proxy.rlwy.net:23751/railway';

async function main() {
  const conn = await mysql.createConnection(URL);
  console.log('Conectado a Railway.');

  const usuarios = [
    ['Christian', 'christian@fruteria.com', 'admin123', 'admin'],
    ['Chuy', 'chuy@fruteria.com', 'chuy123', 'repartidor'],
    ['Alexa', 'alexa@fruteria.com', 'alexa123', 'tomador'],
  ];
  for (const [nombre, email, pass, rol] of usuarios) {
    const hash = await bcrypt.hash(pass, 10);
    await conn.execute(
      'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE nombre = VALUES(nombre)',
      [nombre, email, hash, rol]
    );
    console.log('usuario:', nombre, '(' + rol + ')');
  }

  const productos = [['Manzana',0],['Aguacate',0],['Jitomate',0],['Platano',0],['Chile serrano',0],['Ensalada italiana',1]];
  for (const [n, f] of productos) {
    await conn.execute('INSERT INTO productos (nombre, precio_fijo) VALUES (?, ?)', [n, f]);
  }
  console.log(productos.length, 'productos creados');

  await conn.execute('INSERT INTO cuentas (nombre, saldo) VALUES (?, ?)', ['Empresa', 0]);
  await conn.execute('INSERT INTO cuentas (nombre, saldo) VALUES (?, ?)', ['Ahorro', 0]);
  console.log('cuentas creadas');

  console.log('LISTO. Ya puedes iniciar sesion con christian@fruteria.com / admin123');
  await conn.end();
}
main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });