/**
 * Middleware que valida que req.params.id sea un entero positivo.
 * Previene ataques como GET /clientes/../../etc/passwd o
 * GET /clientes/1;DROP TABLE clientes.
 *
 * Uso: router.get('/:id', validarId, autenticar, Controller.obtener);
 */
function validarId(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'ID inválido' });
  }
  req.params.id = id; // Convertir a número para evitar coerción implícita
  next();
}

module.exports = validarId;
