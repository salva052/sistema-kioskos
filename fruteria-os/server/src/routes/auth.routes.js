const express = require('express');
const router = express.Router();

const AuthController = require('../controllers/auth.controller');
const { autenticar, autorizar } = require('../middleware/auth');
const validarId = require('../middleware/validarId');

// POST /api/auth/login - publico
router.post('/login', AuthController.login);

// POST /api/auth/registrar - solo admin puede crear usuarios
router.post('/registrar', autenticar, autorizar('admin'), AuthController.registrar);

// GET /api/auth/me - perfil del usuario autenticado
router.get('/me', autenticar, AuthController.perfil);

// GET /api/auth/usuarios - lista de usuarios (solo admin)
router.get('/usuarios', autenticar, autorizar('admin'), AuthController.listar);

// DELETE /api/auth/usuarios/:id - desactivar usuario (solo admin)
// IMPORTANTE: esta ruta debe estar ANTES del module.exports
router.delete('/usuarios/:id', autenticar, validarId, autorizar('admin'), AuthController.eliminar);

module.exports = router;
