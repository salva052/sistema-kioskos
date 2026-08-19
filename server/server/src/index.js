require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes      = require('./routes/auth.routes');
const clienteRoutes   = require('./routes/cliente.routes');
const productoRoutes  = require('./routes/producto.routes');
const pedidoRoutes    = require('./routes/pedido.routes');
const cobroRoutes     = require('./routes/cobro.routes');
const gastoRoutes     = require('./routes/gasto.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const { ProductoService } = require('./services/producto.service');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Seguridad: headers HTTP seguros ──────────────────────────────────────────
// Helmet agrega headers que previenen XSS, clickjacking, sniffing de MIME, etc.
app.use(helmet());

// ── CORS: solo acepta el origen del frontend en produccion ───────────────────
// En desarrollo acepta localhost. NUNCA en true en produccion.
const origenes = [
  process.env.CLIENT_ORIGIN,
  'http://localhost:5173',
  'http://localhost:4173',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Permitir peticiones sin origin (Postman, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (origenes.includes(origin)) return callback(null, true);
    callback(new Error(`CORS bloqueado para origen: ${origin}`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '100kb' })); // Limitar tamaño del body

// ── Rate limiting en login: max 10 intentos por IP cada 15 minutos ────────────
// Previene ataques de fuerza bruta en las credenciales.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos de login. Intenta de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Rate limiting general: 200 peticiones por IP cada 15 min ─────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Demasiadas peticiones. Intenta de nuevo más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', generalLimiter);

// Healthcheck (sin auth)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', servicio: 'Sistema Kioskos API', hora: new Date().toISOString() });
});

// Modulos
app.use('/api/auth/login', loginLimiter); // Rate limit estricto solo en login
app.use('/api/auth',      authRoutes);
app.use('/api/clientes',  clienteRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/pedidos',   pedidoRoutes);
app.use('/api/cobros',    cobroRoutes);
app.use('/api/gastos',    gastoRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ── Manejo de rutas no encontradas ───────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// ── Manejo central de errores ─────────────────────────────────────────────────
// NUNCA exponer el stack trace en produccion.
app.use((err, req, res, next) => {
  const esProd = process.env.NODE_ENV === 'production';
  // Solo loguear en el servidor, nunca enviar al cliente
  if (!esProd) console.error('[ERROR]', err.message, err.stack);
  else console.error('[ERROR]', err.message);

  res.status(err.status || 500).json({
    error: esProd && !err.status
      ? 'Error interno del servidor'
      : (err.message || 'Error interno del servidor'),
    // Si el error incluye un producto existente (caso 409 de duplicado),
    // lo pasamos al cliente para que pueda guardar el precio sin bloqueo.
    ...(err.productoExistente ? { productoExistente: err.productoExistente } : {}),
  });
});

app.listen(PORT, () => {
  console.log(`Sistema Kioskos API corriendo en el puerto ${PORT}`);
});

// Asegura que exista el producto especial "Envío" (precio libre por
// pedido). Es idempotente: si ya existe no hace nada. Si la columna
// es_envio aun no existe en la base (falta correr la migracion),
// solo avisa por consola sin tumbar el servidor.
ProductoService.asegurarProductoEnvio()
  .then(() => console.log('Producto "Envío" listo.'))
  .catch((e) => console.warn('[WARN] No se pudo preparar el producto Envío:', e.message));

module.exports = app;
