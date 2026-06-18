const express = require('express');
const router = express.Router();

const ProductoController = require('../controllers/producto.controller');
const { autenticar, autorizar } = require('../middleware/auth');

router.use(autenticar);

// Precios diarios: ver la lista la usan todos los que registran pedidos;
// guardarla (costos y precios) es trabajo del admin.
router.get('/precios', autorizar('admin', 'tomador', 'repartidor'), ProductoController.listaDelDia);
router.post('/precios', autorizar('admin'), ProductoController.guardarLista);

// Catalogo de productos: solo admin lo gestiona; todos lo consultan.
router.get('/', autorizar('admin', 'tomador', 'repartidor'), ProductoController.listar);
router.post('/', autorizar('admin'), ProductoController.crear);
router.put('/:id', autorizar('admin'), ProductoController.actualizar);
router.delete('/:id', autorizar('admin'), ProductoController.eliminar);

module.exports = router;
