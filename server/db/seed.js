require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../src/config/db');

async function seed() {
  console.log('Sembrando datos iniciales...');

  const usuarios = [
    { nombre: 'Christian', email: 'christian@fruteria.com', password: 'admin123', rol: 'admin' },
    { nombre: 'Chuy', email: 'chuy@fruteria.com', password: 'chuy123', rol: 'repartidor' },
    { nombre: 'Alexa', email: 'alexa@fruteria.com', password: 'alexa123', rol: 'tomador' },
  ];
  for (const u of usuarios) {
    const hash = await bcrypt.hash(u.password, 10);
    await pool.execute(
      `INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE nombre = VALUES(nombre)`,
      [u.nombre, u.email, hash, u.rol]
    );
    console.log(`  usuario: ${u.nombre} (${u.rol})`);
  }

  const productos = [
    ['Manzana', false], ['Aguacate', false], ['Jitomate', false],
    ['Platano', false], ['Chile serrano', false], ['Ensalada italiana', true],
  ];
  for (const [nombre, fijo] of productos) {
    await pool.execute('INSERT INTO productos (nombre, precio_fijo) VALUES (?, ?)', [nombre, fijo ? 1 : 0]);
  }
  console.log(`  ${productos.length} productos creados`);

  await pool.execute('INSERT INTO cuentas (nombre, saldo) VALUES (?, ?)', ['Empresa', 0]);
  await pool.execute('INSERT INTO cuentas (nombre, saldo) VALUES (?, ?)', ['Ahorro', 0]);
  console.log('  2 cuentas de caja creadas');

  console.log('\nListo. Credenciales de prueba:');
  console.log('  admin       -> christian@fruteria.com / admin123');
  console.log('  repartidor  -> chuy@fruteria.com / chuy123');
  console.log('  tomador     -> alexa@fruteria.com / alexa123');
  await pool.end();
}
seed().catch((e) => { console.error(e); process.exit(1); });
