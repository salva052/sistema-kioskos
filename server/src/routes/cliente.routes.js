const express = require('express');
const router = express.Router();

const ClienteController = require('../controllers/cliente.controller');
const { autenticar, autorizar } = require('../middleware/auth');

// Todas las rutas de clientes requieren autenticacion
router.use(autenticar);

// Consultar: admin y tomador de pedidos
router.get('/', autorizar('admin', 'tomador'), ClienteController.listar);
router.get('/deudores', autorizar('admin'), ClienteController.deudores);
router.get('/:id', autorizar('admin', 'tomador'), ClienteController.obtener);

// Crear / editar: admin y tomador de pedidos
router.post('/', autorizar('admin', 'tomador'), ClienteController.crear);
router.put('/:id', autorizar('admin', 'tomador'), ClienteController.actualizar);

// Eliminar (desactivar): solo admin
router.delete('/:id', autorizar('admin'), ClienteController.eliminar);

module.exports = router;
