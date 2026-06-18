const bcrypt = require('bcryptjs');
const assert = require('assert');
const adapter = require('./sqlite-adapter');

async function main() {
  await adapter.init();
  const dbPath = require.resolve('../src/config/db');
  require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: adapter };

  const seedUsers = [
    ['Christian', 'christian@fruteria.com', 'admin123', 'admin'],
    ['Chuy', 'chuy@fruteria.com', 'chuy123', 'repartidor'],
    ['Alexa', 'alexa@fruteria.com', 'alexa123', 'tomador'],
  ];
  for (const [nombre, email, pass, rol] of seedUsers) {
    const hash = await bcrypt.hash(pass, 10);
    await adapter.execute('INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)', [nombre, email, hash, rol]);
  }
  await adapter.execute("INSERT INTO productos (nombre, precio_fijo) VALUES ('Manzana', 0)");
  await adapter.execute("INSERT INTO productos (nombre, precio_fijo) VALUES ('Aguacate', 0)");

  const request = require('supertest');
  const app = require('../src/index');
  let n = 0;
  const ok = (m) => { console.log('  PASS -', m); n++; };
  const login = async (e, p) => (await request(app).post('/api/auth/login').send({ email: e, password: p })).body.token;

  const tAdmin = await login('christian@fruteria.com', 'admin123');
  const tChuy = await login('chuy@fruteria.com', 'chuy123');
  const tAlexa = await login('alexa@fruteria.com', 'alexa123');
  ok('login de los 3 roles');

  const hoy = new Date().toISOString().slice(0, 10);

  let r = await request(app).post('/api/productos/precios').set('Authorization', `Bearer ${tAlexa}`)
    .send({ fecha: hoy, items: [{ productoId: 1, costo: 10, precioVenta: 13 }] });
  assert.strictEqual(r.status, 403);
  ok('tomador NO puede guardar precios (403)');

  r = await request(app).post('/api/productos/precios').set('Authorization', `Bearer ${tAdmin}`)
    .send({ fecha: hoy, items: [{ productoId: 1, costo: 10, precioVenta: 13 }, { productoId: 2, costo: 20, precioVenta: 26 }] });
  assert.strictEqual(r.status, 200);
  ok('admin guarda precios del dia');

  r = await request(app).get(`/api/productos/precios?fecha=${hoy}`).set('Authorization', `Bearer ${tAdmin}`);
  const manzana = r.body.items.find((i) => i.productoId === 1);
  assert.strictEqual(manzana.margen, 30);
  assert.strictEqual(r.body.margenGeneral, 30);
  ok('margen calculado correctamente (30% por producto y general)');

  const manana = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  r = await request(app).get(`/api/productos/precios?fecha=${manana}`).set('Authorization', `Bearer ${tAdmin}`);
  assert.strictEqual(r.body.items.length, 2);
  assert.strictEqual(r.body.items[0].heredado, true);
  ok('precios se arrastran del dia anterior (heredado=true)');

  r = await request(app).post('/api/clientes').set('Authorization', `Bearer ${tAlexa}`).send({ nombre: 'Tiendita La Esquina', deuda: 0 });
  const clienteId = r.body.id;
  ok('Alexa (tomador) crea cliente');

  r = await request(app).post('/api/pedidos').set('Authorization', `Bearer ${tAlexa}`)
    .send({ clienteId, fecha: hoy, items: [{ productoId: 1, cantidad: 5 }, { productoId: 2, cantidad: 2 }] });
  assert.strictEqual(r.status, 201);
  assert.strictEqual(r.body.total, 117);
  assert.strictEqual(r.body.detalle.length, 2);
  const pedidoId = r.body.id;
  ok('Alexa crea pedido; total calculado en backend = 117');

  r = await request(app).get(`/api/clientes/${clienteId}`).set('Authorization', `Bearer ${tAdmin}`);
  assert.strictEqual(Number(r.body.deuda), 117);
  ok('el pedido aumento la deuda del cliente a 117 (transaccion)');

  r = await request(app).patch(`/api/pedidos/${pedidoId}/estado`).set('Authorization', `Bearer ${tAlexa}`).send({ estado: 'entregado' });
  assert.strictEqual(r.status, 403);
  ok('tomador NO puede cambiar estado de pedido (403)');

  r = await request(app).patch(`/api/pedidos/${pedidoId}/estado`).set('Authorization', `Bearer ${tChuy}`).send({ estado: 'entregado' });
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.body.estado, 'entregado');
  ok('Chuy (repartidor) marca pedido como entregado');

  r = await request(app).post('/api/cobros').set('Authorization', `Bearer ${tChuy}`)
    .send({ clienteId, pedidoId, monto: 100, metodoPago: 'efectivo', fecha: hoy });
  assert.strictEqual(r.status, 201);
  ok('Chuy registra cobro de 100');

  r = await request(app).get(`/api/clientes/${clienteId}`).set('Authorization', `Bearer ${tAdmin}`);
  assert.strictEqual(Number(r.body.deuda), 17);
  ok('el cobro abono a la deuda: 117 - 100 = 17 (transaccion)');

  r = await request(app).post('/api/gastos').set('Authorization', `Bearer ${tAdmin}`).send({ categoria: 'gasolina', monto: 300, fecha: hoy });
  assert.strictEqual(r.status, 201);
  ok('admin registra gasto de gasolina');

  r = await request(app).get('/api/dashboard').set('Authorization', `Bearer ${tChuy}`);
  assert.strictEqual(r.status, 403);
  ok('repartidor NO accede al dashboard (403)');

  r = await request(app).get(`/api/dashboard?desde=${hoy}&hasta=${hoy}`).set('Authorization', `Bearer ${tAdmin}`);
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.body.ingresos, 100);
  assert.strictEqual(r.body.egresos, 300);
  assert.strictEqual(r.body.utilidad, -200);
  assert.strictEqual(r.body.clientesActivos, 1);
  assert.strictEqual(r.body.ticketPromedio, 117);
  ok('dashboard agrega ingresos, egresos, utilidad, ticket y clientes activos');

  console.log(`\n  ${n} bloques de prueba pasaron correctamente.`);
  await adapter.end();
  process.exit(0);
}
main().catch((e) => { console.error('FALLO:', e.message, '\n', e.stack); process.exit(1); });
