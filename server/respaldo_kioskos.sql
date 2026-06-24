-- ============================================================
-- Sistema Kiosko's — Respaldo de base de datos
-- Fecha: 20/6/2026, 1:12:31 p.m.
-- ============================================================

SET FOREIGN_KEY_CHECKS=0;

-- Tabla: clientes
DROP TABLE IF EXISTS clientes;
CREATE TABLE `clientes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) NOT NULL,
  `telefono` varchar(30) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `ubicacion` varchar(120) DEFAULT NULL,
  `deuda` decimal(10,2) NOT NULL DEFAULT '0.00',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_clientes_nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO clientes (id, nombre, telefono, direccion, ubicacion, deuda, activo, creado_en) VALUES
(1, 'Jael Contreras', '4496565812', 'prueba #101', NULL, '588.43', 1, '2026-06-19 22:46:49'),
(2, 'Atenea Gonzalez', '54558555855', 'Prueba 2', NULL, '21.42', 1, '2026-06-20 02:27:56'),
(3, 'pepe', '449 465 6789', 'av del molino 223', NULL, '2.00', 1, '2026-06-20 03:55:15'),
(4, 'g', NULL, NULL, NULL, '0.00', 1, '2026-06-20 04:22:21');

-- Tabla: cobros
DROP TABLE IF EXISTS cobros;
CREATE TABLE `cobros` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cliente_id` int NOT NULL,
  `pedido_id` int DEFAULT NULL,
  `monto` decimal(10,2) NOT NULL,
  `metodo_pago` enum('efectivo','transferencia') NOT NULL DEFAULT 'efectivo',
  `fecha` date NOT NULL,
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_cobro_cliente` (`cliente_id`),
  KEY `fk_cobro_pedido` (`pedido_id`),
  CONSTRAINT `fk_cobro_cliente` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_cobro_pedido` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO cobros (id, cliente_id, pedido_id, monto, metodo_pago, fecha, creado_en) VALUES
(1, 1, NULL, '150.00', 'efectivo', '2026-06-19 06:00:00', '2026-06-20 02:29:29'),
(2, 2, NULL, '400.00', 'efectivo', '2026-06-19 06:00:00', '2026-06-20 03:52:00');

-- Tabla: cuentas
DROP TABLE IF EXISTS cuentas;
CREATE TABLE `cuentas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(120) NOT NULL,
  `saldo` decimal(12,2) NOT NULL DEFAULT '0.00',
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO cuentas (id, nombre, saldo, creado_en) VALUES
(1, 'Empresa', '0.00', '2026-06-19 22:21:25'),
(2, 'Ahorro', '0.00', '2026-06-19 22:21:25');

-- Tabla: detalle_pedido
DROP TABLE IF EXISTS detalle_pedido;
CREATE TABLE `detalle_pedido` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pedido_id` int NOT NULL,
  `producto_id` int NOT NULL,
  `cantidad` decimal(10,2) NOT NULL,
  `precio_unit` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_detalle_pedido` (`pedido_id`),
  KEY `fk_detalle_producto` (`producto_id`),
  CONSTRAINT `fk_detalle_pedido` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_detalle_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO detalle_pedido (id, pedido_id, producto_id, cantidad, precio_unit, subtotal) VALUES
(1, 1, 8, '0.34', '35.71', '12.14'),
(2, 1, 7, '0.54', '28.57', '15.43'),
(3, 1, 9, '0.36', '50.00', '18.00'),
(4, 2, 10, '2.00', '14.29', '28.58'),
(5, 2, 7, '4.00', '28.57', '114.28'),
(6, 3, 8, '5.00', '35.71', '178.55'),
(7, 3, 10, '3.00', '14.29', '42.87'),
(8, 3, 9, '2.00', '50.00', '100.00');

-- Tabla: gastos
DROP TABLE IF EXISTS gastos;
CREATE TABLE `gastos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int DEFAULT NULL,
  `categoria` enum('gasolina','nomina','publicidad','mantenimiento','otro') NOT NULL DEFAULT 'otro',
  `descripcion` varchar(255) DEFAULT NULL,
  `monto` decimal(10,2) NOT NULL,
  `fecha` date NOT NULL,
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_gasto_usuario` (`usuario_id`),
  KEY `idx_gastos_fecha` (`fecha`),
  CONSTRAINT `fk_gasto_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO gastos (id, usuario_id, categoria, descripcion, monto, fecha, creado_en) VALUES
(1, 1, 'nomina', 'Pago Repartidor', '1500.00', '2026-06-19 06:00:00', '2026-06-20 02:29:49');

-- Tabla: movimientos
DROP TABLE IF EXISTS movimientos;
CREATE TABLE `movimientos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cuenta_id` int NOT NULL,
  `tipo` enum('entrada','salida','transferencia') NOT NULL,
  `monto` decimal(12,2) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `fecha` date NOT NULL,
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_mov_cuenta` (`cuenta_id`),
  CONSTRAINT `fk_mov_cuenta` FOREIGN KEY (`cuenta_id`) REFERENCES `cuentas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- (sin registros)

-- Tabla: pedidos
DROP TABLE IF EXISTS pedidos;
CREATE TABLE `pedidos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cliente_id` int NOT NULL,
  `usuario_id` int DEFAULT NULL,
  `estado` enum('pendiente','entregado') NOT NULL DEFAULT 'pendiente',
  `total` decimal(10,2) NOT NULL DEFAULT '0.00',
  `fecha` date NOT NULL,
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_pedido_cliente` (`cliente_id`),
  KEY `fk_pedido_usuario` (`usuario_id`),
  KEY `idx_pedidos_estado` (`estado`),
  KEY `idx_pedidos_fecha` (`fecha`),
  CONSTRAINT `fk_pedido_cliente` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_pedido_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO pedidos (id, cliente_id, usuario_id, estado, total, fecha, creado_en) VALUES
(1, 1, 1, 'pendiente', '45.57', '2026-06-19 06:00:00', '2026-06-19 22:50:20'),
(2, 1, 1, 'entregado', '142.86', '2026-06-19 06:00:00', '2026-06-19 22:51:10'),
(3, 2, 1, 'entregado', '321.42', '2026-06-19 06:00:00', '2026-06-20 03:50:28');

-- Tabla: precios_diarios
DROP TABLE IF EXISTS precios_diarios;
CREATE TABLE `precios_diarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `producto_id` int NOT NULL,
  `costo` decimal(10,2) NOT NULL DEFAULT '0.00',
  `precio_venta` decimal(10,2) NOT NULL DEFAULT '0.00',
  `fecha` date NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_precio_producto_fecha` (`producto_id`,`fecha`),
  CONSTRAINT `fk_precio_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO precios_diarios (id, producto_id, costo, precio_venta, fecha) VALUES
(1, 7, '20.00', '28.57', '2026-06-19 06:00:00'),
(2, 8, '25.00', '35.71', '2026-06-19 06:00:00'),
(3, 9, '35.00', '50.00', '2026-06-19 06:00:00'),
(4, 10, '10.00', '14.29', '2026-06-19 06:00:00'),
(9, 11, '40.00', '60.00', '2026-06-19 06:00:00');

-- Tabla: productos
DROP TABLE IF EXISTS productos;
CREATE TABLE `productos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(120) NOT NULL,
  `precio_fijo` tinyint(1) NOT NULL DEFAULT '0',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO productos (id, nombre, precio_fijo, activo, creado_en) VALUES
(1, 'Manzana', 0, 1, '2026-06-19 22:21:24'),
(2, 'Aguacate', 0, 1, '2026-06-19 22:21:24'),
(3, 'Jitomate', 0, 1, '2026-06-19 22:21:24'),
(4, 'Platano', 0, 1, '2026-06-19 22:21:24'),
(5, 'Chile serrano', 0, 1, '2026-06-19 22:21:24'),
(6, 'Ensalada italiana', 1, 1, '2026-06-19 22:21:25'),
(7, 'sandía ', 0, 1, '2026-06-19 22:48:22'),
(8, 'pepino ', 0, 1, '2026-06-19 22:48:40'),
(9, 'uva ', 0, 1, '2026-06-19 22:48:53'),
(10, 'platano', 0, 0, '2026-06-19 22:50:15'),
(11, 'fresas de el himalaya', 0, 1, '2026-06-20 03:51:22');

-- Tabla: usuarios
DROP TABLE IF EXISTS usuarios;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(120) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `rol` enum('admin','repartidor','tomador') NOT NULL DEFAULT 'tomador',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO usuarios (id, nombre, email, password_hash, rol, activo, creado_en) VALUES
(1, 'Christian', 'christian@fruteria.com', '$2a$10$aNSj3cDk2xKxwjBBzAwvie87BS7OiJ9kfKwbJWVc9RQFk82MRbFJe', 'admin', 1, '2026-06-19 22:21:23'),
(2, 'Chuy', 'chuy@fruteria.com', '$2a$10$38BsmkNhHQAIL3YQY2.d6OGMjWOdbDmCkXIRdscxe1CE/OxmMyBqy', 'repartidor', 1, '2026-06-19 22:21:23'),
(3, 'Alexa', 'alexa@fruteria.com', '$2a$10$fX/xVwt//duBzQ5Tj6M2zehWj.Zr3vM2KkS83NdD/cSMZhzw9bhgC', 'tomador', 1, '2026-06-19 22:21:24'),
(4, 'f', 'f@g.com', '$2a$10$vY3u05vMJui4DEFuhCl3z.dN/zfzWA7uc7BAvkwfrCCF3PxxAywKG', 'tomador', 1, '2026-06-20 04:23:38');

SET FOREIGN_KEY_CHECKS=1;
