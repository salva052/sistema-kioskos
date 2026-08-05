// Servidor de DEMO: API real con datos de ejemplo en SQLite (memoria).
// Solo para capturas/demostracion; produccion usa MySQL.
const bcrypt = require('bcryptjs');
const adapter = require('./sqlite-adapter');

async function start() {
  await adapter.init();
  const dbPath = require.resolve('../src/config/db');
  require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: adapter };

  // Usuarios
  const users = [
    ['Christian', 'christian@fruteria.com', 'admin123', 'admin'],
    ['Chuy', 'chuy@fruteria.com', 'chuy123', 'repartidor'],
    ['Alexa', 'alexa@fruteria.com', 'alexa123', 'tomador'],
  ];
  for (const [n, e, p, r] of users) {
    const h = await bcrypt.hash(p, 10);
    await adapter.execute('INSERT INTO usuarios (nombre,email,password_hash,rol) VALUES (?,?,?,?)', [n, e, h, r]);
  }
  // Productos
  const prods = [['Manzana',0],['Aguacate',0],['Jitomate',0],['Platano',0],['Chile serrano',0]];
  for (const [n, f] of prods) await adapter.execute('INSERT INTO productos (nombre,precio_fijo) VALUES (?,?)', [n, f]);
  // Precios de hoy
  const hoy = new Date().toISOString().slice(0,10);
  const precios = [[1,10,13],[2,40,54],[3,18,24],[4,12,16],[5,30,42]];
  for (const [pid,c,v] of precios) await adapter.execute('INSERT INTO precios_diarios (producto_id,costo,precio_venta,fecha) VALUES (?,?,?,?)',[pid,c,v,hoy]);
  // Clientes con deudas variadas
  const cli = [['Tiendita La Esquina','4491112233','Av. Independencia 120',1850],
    ['Abarrotes Don Pancho','4492223344','Calle Morelos 45',640],
    ['Mini Súper Aurora','4493334455','Bosques del Prado 8',230],
    ['Frutería Mamá','4494445566','Centro',0]];
  for (const [n,t,d,deu] of cli) await adapter.execute('INSERT INTO clientes (nombre,telefono,direccion,deuda) VALUES (?,?,?,?)',[n,t,d,deu]);
  // Un pedido entregado + cobro + gastos para que el dashboard tenga numeros
  await adapter.execute('INSERT INTO pedidos (cliente_id,usuario_id,estado,total,fecha) VALUES (?,?,?,?,?)',[1,3,'entregado',650,hoy]);
  await adapter.execute('INSERT INTO pedidos (cliente_id,usuario_id,estado,total,fecha) VALUES (?,?,?,?,?)',[2,3,'pendiente',420,hoy]);
  await adapter.execute('INSERT INTO cobros (cliente_id,monto,metodo_pago,fecha) VALUES (?,?,?,?)',[1,500,'efectivo',hoy]);
  await adapter.execute('INSERT INTO cobros (cliente_id,monto,metodo_pago,fecha) VALUES (?,?,?,?)',[2,300,'transferencia',hoy]);
  await adapter.execute('INSERT INTO gastos (categoria,descripcion,monto,fecha) VALUES (?,?,?,?)',['gasolina','Diésel camioneta',300,hoy]);
  await adapter.execute('INSERT INTO gastos (categoria,descripcion,monto,fecha) VALUES (?,?,?,?)',['nomina','Pago semanal',1200,hoy]);

  const app = require('../src/index');
  console.log('DEMO server listo en 3001');
}
start().catch(e => { console.error(e); process.exit(1); });
