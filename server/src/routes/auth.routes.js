const express = require('express');
const router = express.Router();

const AuthController = require('../controllers/auth.controller');
const { autenticar, autorizar } = require('../middleware/auth');

// POST /api/auth/login - publico
router.post('/login', AuthController.login);

// POST /api/auth/registrar - solo el admin puede crear usuarios/empleados
router.post('/registrar', autenticar, autorizar('admin'), AuthController.registrar);

// GET /api/auth/me - cualquier usuario autenticado consulta su perfil
router.get('/me', autenticar, AuthController.perfil);

// GET /api/auth/usuarios - lista de usuarios (solo admin)
router.get('/usuarios', autenticar, autorizar('admin'), AuthController.listar);

module.exports = router;
