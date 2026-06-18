const express = require('express');
const router = express.Router();

const CobroController = require('../controllers/cobro.controller');
const { autenticar, autorizar } = require('../middleware/auth');

router.use(autenticar);

// Consultar cobros: admin (todo) y repartidor (los que cobra)
router.get('/', autorizar('admin', 'repartidor'), CobroController.listar);

// Registrar cobro: admin y repartidor (Chuy)
router.post('/', autorizar('admin', 'repartidor'), CobroController.crear);

module.exports = router;
