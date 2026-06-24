-- ============================================================
--  FRUTERIA OS - Esquema de base de datos (MySQL)
--  Sistema de gestion para distribuidora de fruta y verdura
-- ============================================================

-- Crear la base de datos (ejecutar una sola vez)

-- ------------------------------------------------------------
--  USUARIOS DEL SISTEMA (con roles)
--  roles: admin | repartidor | tomador
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(120)  NOT NULL,
  email         VARCHAR(150)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  rol           ENUM('admin','repartidor','tomador') NOT NULL DEFAULT 'tomador',
  activo        BOOLEAN       NOT NULL DEFAULT TRUE,
  creado_en     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
--  CLIENTES
--  deuda: saldo acumulado que el cliente debe
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clientes (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(150) NOT NULL,
  telefono    VARCHAR(30),
  direccion   VARCHAR(255),
  ubicacion   VARCHAR(120),              -- "lat,lng" de Google Maps (fase 2)
  deuda       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  activo      BOOLEAN       NOT NULL DEFAULT TRUE,
  creado_en   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_clientes_nombre (nombre)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
--  PRODUCTOS (catalogo)
--  precio_fijo: TRUE = no se le puede subir precio a ningun cliente
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS productos (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(120) NOT NULL,
  precio_fijo BOOLEAN      NOT NULL DEFAULT FALSE,
  activo      BOOLEAN      NOT NULL DEFAULT TRUE,
  creado_en   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
--  PRECIOS DIARIOS
--  costo = lo que le costo a la fruteria; precio_venta = lo que cobra
--  Un registro por producto por dia.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS precios_diarios (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  producto_id  INT           NOT NULL,
  costo        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  precio_venta DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  fecha        DATE          NOT NULL,
  CONSTRAINT fk_precio_producto FOREIGN KEY (producto_id)
    REFERENCES productos(id) ON DELETE CASCADE,
  UNIQUE KEY uq_precio_producto_fecha (producto_id, fecha)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
--  PEDIDOS
--  estado: pendiente | entregado  (se puede ampliar)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pedidos (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id  INT           NOT NULL,
  usuario_id  INT,                       -- quien registro el pedido
  estado      ENUM('pendiente','entregado') NOT NULL DEFAULT 'pendiente',
  total       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  fecha       DATE          NOT NULL,
  creado_en   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pedido_cliente FOREIGN KEY (cliente_id)
    REFERENCES clientes(id) ON DELETE RESTRICT,
  CONSTRAINT fk_pedido_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_pedidos_estado (estado),
  INDEX idx_pedidos_fecha (fecha)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
--  DETALLE DE PEDIDO (renglones)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS detalle_pedido (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id   INT           NOT NULL,
  producto_id INT           NOT NULL,
  cantidad    DECIMAL(10,2) NOT NULL,
  precio_unit DECIMAL(10,2) NOT NULL,
  subtotal    DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_detalle_pedido FOREIGN KEY (pedido_id)
    REFERENCES pedidos(id) ON DELETE CASCADE,
  CONSTRAINT fk_detalle_producto FOREIGN KEY (producto_id)
    REFERENCES productos(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ------------------------------------------------------------
--  COBROS (ingresos / abonos a deuda)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cobros (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id  INT           NOT NULL,
  pedido_id   INT,                       -- opcional: cobro asociado a un pedido
  monto       DECIMAL(10,2) NOT NULL,
  metodo_pago ENUM('efectivo','transferencia') NOT NULL DEFAULT 'efectivo',
  fecha       DATE          NOT NULL,
  creado_en   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cobro_cliente FOREIGN KEY (cliente_id)
    REFERENCES clientes(id) ON DELETE RESTRICT,
  CONSTRAINT fk_cobro_pedido FOREIGN KEY (pedido_id)
    REFERENCES pedidos(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------
--  GASTOS (egresos)
--  categoria: gasolina | nomina | publicidad | mantenimiento | otro
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gastos (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT,
  categoria   ENUM('gasolina','nomina','publicidad','mantenimiento','otro') NOT NULL DEFAULT 'otro',
  descripcion VARCHAR(255),
  monto       DECIMAL(10,2) NOT NULL,
  fecha       DATE          NOT NULL,
  creado_en   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_gasto_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_gastos_fecha (fecha)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
--  CUENTAS DE CAJA (empresa, ahorro, etc.)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cuentas (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(120)  NOT NULL,
  saldo       DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  creado_en   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
--  MOVIMIENTOS DE CAJA
--  tipo: entrada | salida | transferencia
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS movimientos (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  cuenta_id   INT           NOT NULL,
  tipo        ENUM('entrada','salida','transferencia') NOT NULL,
  monto       DECIMAL(12,2) NOT NULL,
  descripcion VARCHAR(255),
  fecha       DATE          NOT NULL,
  creado_en   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_mov_cuenta FOREIGN KEY (cuenta_id)
    REFERENCES cuentas(id) ON DELETE CASCADE
) ENGINE=InnoDB;
