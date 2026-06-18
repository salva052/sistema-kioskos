const express = require('express');
const router = express.Router();

const DashboardController = require('../controllers/dashboard.controller');
const { autenticar, autorizar } = require('../middleware/auth');

// El dashboard financiero es exclusivo del admin (Christian)
router.use(autenticar);
router.get('/', autorizar('admin'), DashboardController.resumen);

module.exports = router;
