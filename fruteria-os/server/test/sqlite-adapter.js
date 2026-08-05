/**
 * Adaptador de PRUEBAS unicamente.
 * Expone la misma interfaz que el pool de mysql2 (execute / end)
 * pero respaldado por SQLite en memoria (sql.js).
 * Permite probar el flujo real del API sin un servidor MySQL.
 *
 * NO se usa en produccion; el codigo real usa src/config/db.js (mysql2).
 */
const initSqlJs = require('sql.js');

let db = null;

// Esquema equivalente en sintaxis SQLite (los modelos usan SQL estandar)
const schema = `
CREATE TABLE usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'tomador',
  activo INTEGER NOT NULL DEFAULT 1,
  creado_en TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  telefono TEXT,
  direccion TEXT,
  ubicacion TEXT,
  deuda REAL NOT NULL DEFAULT 0,
  activo INTEGER NOT NULL DEFAULT 1,
  creado_en TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE productos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  precio_fijo INTEGER NOT NULL DEFAULT 0,
  activo INTEGER NOT NULL DEFAULT 1,
  creado_en TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE precios_diarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  producto_id INTEGER NOT NULL,
  costo REAL NOT NULL DEFAULT 0,
  precio_venta REAL NOT NULL DEFAULT 0,
  fecha TEXT NOT NULL,
  UNIQUE (producto_id, fecha)
);
CREATE TABLE pedidos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL,
  usuario_id INTEGER,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  total REAL NOT NULL DEFAULT 0,
  fecha TEXT NOT NULL,
  creado_en TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE detalle_pedido (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pedido_id INTEGER NOT NULL,
  producto_id INTEGER NOT NULL,
  cantidad REAL NOT NULL,
  precio_unit REAL NOT NULL,
  subtotal REAL NOT NULL
);
CREATE TABLE cobros (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL,
  pedido_id INTEGER,
  monto REAL NOT NULL,
  metodo_pago TEXT NOT NULL DEFAULT 'efectivo',
  fecha TEXT NOT NULL,
  creado_en TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE gastos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER,
  categoria TEXT NOT NULL DEFAULT 'otro',
  descripcion TEXT,
  monto REAL NOT NULL,
  fecha TEXT NOT NULL,
  creado_en TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE cuentas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  saldo REAL NOT NULL DEFAULT 0,
  creado_en TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE movimientos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cuenta_id INTEGER NOT NULL,
  tipo TEXT NOT NULL,
  monto REAL NOT NULL,
  descripcion TEXT,
  fecha TEXT NOT NULL,
  creado_en TEXT DEFAULT CURRENT_TIMESTAMP
);
`;

async function init() {
  const SQL = await initSqlJs();
  db = new SQL.Database();
  db.run(schema);
}

// booleano TRUE/FALSE de MySQL -> 1/0 de SQLite
function adaptarSql(sql) {
  let s = sql.replace(/\bTRUE\b/gi, '1').replace(/\bFALSE\b/gi, '0');
  // Traducir "ON DUPLICATE KEY UPDATE ..." (MySQL) a "ON CONFLICT DO UPDATE SET ..." (SQLite).
  // Solo se usa en el entorno de prueba; el codigo real corre sobre MySQL.
  if (/ON DUPLICATE KEY UPDATE/i.test(s)) {
    s = s.replace(/\s*ON DUPLICATE KEY UPDATE\s+([\s\S]+)$/i, (m, sets) => {
      const setsSqlite = sets.replace(/VALUES\(\s*(\w+)\s*\)/gi, 'excluded.$1');
      return ` ON CONFLICT DO UPDATE SET ${setsSqlite}`;
    });
  }
  return s;
}

/**
 * Emula pool.execute(sql, params) de mysql2:
 * - SELECT  -> devuelve [rows, fields]
 * - INSERT  -> devuelve [{ insertId, affectedRows }]
 * - UPDATE  -> devuelve [{ affectedRows }]
 */
async function execute(sql, params = []) {
  const adapted = adaptarSql(sql);
  const esSelect = /^\s*select/i.test(adapted);
  if (esSelect) {
    const stmt = db.prepare(adapted);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return [rows, []];
  }
  db.run(adapted, params);
  const esInsert = /^\s*insert/i.test(adapted);
  if (esInsert) {
    const r = db.exec('SELECT last_insert_rowid() AS id');
    const insertId = r[0].values[0][0];
    return [{ insertId, affectedRows: 1 }];
  }
  return [{ affectedRows: db.getRowsModified() }];
}

async function end() { if (db) db.close(); }

/**
 * Emula pool.getConnection() de mysql2 para las transacciones.
 * SQLite (sql.js) es de un solo hilo y secuencial, asi que las
 * transacciones se traducen a BEGIN/COMMIT/ROLLBACK reales.
 */
async function getConnection() {
  return {
    execute,
    async beginTransaction() { db.run('BEGIN'); },
    async commit() { db.run('COMMIT'); },
    async rollback() { db.run('ROLLBACK'); },
    release() {},
  };
}

module.exports = { init, execute, end, getConnection, _raw: () => db };
