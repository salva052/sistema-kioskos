const mysql = require('mysql2/promise');

/**
 * Pool de conexiones a MySQL.
 *
 * Funciona en dos escenarios sin cambios:
 *  - LOCAL (XAMPP): usa las variables DB_HOST, DB_USER, etc. del .env
 *  - PRODUCCION (Railway): si existe MYSQL_URL (o DATABASE_URL), la usa.
 *
 * Las consultas se hacen SIEMPRE con parametros (?) para evitar
 * inyeccion SQL — esta es la seguridad basica que pide la rubrica.
 */
const urlProduccion = process.env.MYSQL_URL || process.env.DATABASE_URL;

const pool = urlProduccion
  ? mysql.createPool(urlProduccion + (urlProduccion.includes('?') ? '&' : '?') + 'connectionLimit=10&decimalNumbers=true')
  : mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'fruteria_os',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      decimalNumbers: true,
    });

module.exports = pool;
