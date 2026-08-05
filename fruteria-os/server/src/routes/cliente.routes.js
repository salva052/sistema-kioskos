const express = require('express');
const router = express.Router();

const ClienteController = require('../controllers/cliente.controller');
const { autenticar, autorizar } = require('../middleware/auth');
const validarId = require('../middleware/validarId');

// Todas las rutas de clientes requieren autenticacion
router.use(autenticar);

// Consultar: admin y tomador de pedidos
router.get('/', autorizar('admin', 'tomador', 'repartidor'), ClienteController.listar);
router.get('/deudores', autorizar('admin'), ClienteController.deudores);
router.get('/:id', validarId, autorizar('admin', 'tomador', 'repartidor'), ClienteController.obtener);

// Crear / editar: admin y tomador de pedidos
router.post('/', autorizar('admin', 'tomador'), ClienteController.crear);
router.put('/:id', validarId, autorizar('admin', 'tomador'), ClienteController.actualizar);

// Eliminar (desactivar): solo admin
router.delete('/:id', validarId, autorizar('admin'), ClienteController.eliminar);
router.put('/:id/deuda/reset', validarId, autorizar('admin'), ClienteController.resetearDeuda);

module.exports = router;
