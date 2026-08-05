const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// En produccion el JWT_SECRET DEBE estar en las variables de entorno.
// Si no está configurado, el servidor no arranca para evitar tokens inseguros.
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('[FATAL] JWT_SECRET no configurado en produccion. Abortando.');
    process.exit(1);
  }
  console.warn('[WARN] JWT_SECRET no configurado. Usando valor inseguro para desarrollo.');
}
const SECRET = JWT_SECRET || 'dev_secret_inseguro_cambiar';

/**
 * Verifica que la peticion traiga un token JWT valido.
 * Si es valido, agrega los datos del usuario a req.user.
 * Protege las rutas: sin token -> 401.
 */
function autenticar(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }
  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalido o expirado' });
  }
}

/**
 * Autorizacion por rol. Se usa DESPUES de autenticar().
 * Recibe los roles permitidos; si el rol del usuario no esta
 * en la lista, devuelve 403.
 *
 * Ejemplo: router.post('/', autenticar, autorizar('admin'), ...)
 */
function autorizar(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (!rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({ error: 'No tienes permiso para esta accion' });
    }
    next();
  };
}

module.exports = { autenticar, autorizar };
