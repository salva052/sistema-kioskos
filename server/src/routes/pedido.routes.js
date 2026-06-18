const express = require('express');
const router = express.Router();

const PedidoController = require('../controllers/pedido.controller');
const { autenticar, autorizar } = require('../middleware/auth');

router.use(autenticar);

// Todos los roles operativos ven y consultan pedidos
router.get('/', autorizar('admin', 'tomador', 'repartidor'), PedidoController.listar);
router.get('/:id', autorizar('admin', 'tomador', 'repartidor'), PedidoController.obtener);

// Crear pedido: admin y tomador de pedidos (Alexa)
router.post('/', autorizar('admin', 'tomador'), PedidoController.crear);

// Cambiar estado (entregar): admin y repartidor (Chuy)
router.patch('/:id/estado', autorizar('admin', 'repartidor'), PedidoController.cambiarEstado);

module.exports = router;
