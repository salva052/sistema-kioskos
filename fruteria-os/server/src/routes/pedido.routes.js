const express = require('express');
const router = express.Router();

const PedidoController = require('../controllers/pedido.controller');
const { autenticar, autorizar } = require('../middleware/auth');
const validarId = require('../middleware/validarId');

router.use(autenticar);

// Todos los roles operativos ven y consultan pedidos
router.get('/', autorizar('admin', 'tomador', 'repartidor'), PedidoController.listar);
router.get('/:id', validarId, autorizar('admin', 'tomador', 'repartidor'), PedidoController.obtener);

// Crear pedido: admin y tomador de pedidos (Alexa)
router.post('/', autorizar('admin', 'tomador'), PedidoController.crear);

// Cambiar estado (entregar): admin y repartidor (Chuy)
router.patch('/:id/estado', validarId, autorizar('admin', 'repartidor'), PedidoController.cambiarEstado);

module.exports = router;

// Eliminar pedido (solo admin)
router.delete('/:id', validarId, autorizar('admin'), PedidoController.eliminar);
