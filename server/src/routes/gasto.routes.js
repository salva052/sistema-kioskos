const express = require('express');
const router = express.Router();

const GastoController = require('../controllers/gasto.controller');
const { autenticar, autorizar } = require('../middleware/auth');

router.use(autenticar);

// Gastos: solo el admin (Christian) los maneja
router.get('/', autorizar('admin'), GastoController.listar);
router.post('/', autorizar('admin'), GastoController.crear);
router.delete('/:id', autorizar('admin'), GastoController.eliminar);

module.exports = router;
