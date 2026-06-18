const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fruteria_secret_cambia_esto';

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
    req.user = jwt.verify(token, JWT_SECRET);
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
