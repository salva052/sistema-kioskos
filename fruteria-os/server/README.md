# Fruteria OS — Backend (API)

Sistema de gestion para distribuidora de fruta y verdura.
Stack: Node.js + Express + MySQL (driver mysql2 con SQL directo).

## Arquitectura en capas

```
rutas  ->  controladores  ->  servicios  ->  modelos  ->  MySQL
            (HTTP)            (logica)        (SQL)
```

## Roles del sistema

- admin      (Christian): acceso total — finanzas, precios, gastos, caja, dashboard
- repartidor (Chuy):      pedidos, entregas, cobros
- tomador    (Alexa):     pedidos, clientes

## Instalacion

1. `npm install`
2. Crear la BD: `mysql -u root -p < db/schema.sql`
3. `cp .env.example .env` y ajustar credenciales de MySQL
4. `npm run seed` (usuarios de los 3 roles + productos + cuentas)
5. `npm run dev` (desarrollo) o `npm start` (produccion)

API en http://localhost:3001

## Credenciales de prueba

| Rol        | Email                  | Contrasena |
|------------|------------------------|------------|
| admin      | christian@fruteria.com | admin123   |
| repartidor | chuy@fruteria.com      | chuy123    |
| tomador    | alexa@fruteria.com     | alexa123   |

## Endpoints

### Auth
- POST /api/auth/login        — iniciar sesion (publico)
- POST /api/auth/registrar    — crear usuario (solo admin)
- GET  /api/auth/me           — perfil

### Clientes
- GET    /api/clientes          — listar (admin, tomador)
- GET    /api/clientes/deudores — deudores ordenados (solo admin)
- GET    /api/clientes/:id      — detalle
- POST   /api/clientes          — crear (admin, tomador)
- PUT    /api/clientes/:id      — editar (admin, tomador)
- DELETE /api/clientes/:id      — desactivar (solo admin)

### Productos y precios
- GET    /api/productos              — catalogo
- POST   /api/productos              — crear (admin)
- PUT    /api/productos/:id          — editar (admin)
- DELETE /api/productos/:id          — desactivar (admin)
- GET    /api/productos/precios?fecha=YYYY-MM-DD — lista del dia (con margen y arrastre)
- POST   /api/productos/precios      — guardar precios del dia (admin)

### Pedidos
- GET   /api/pedidos                 — listar (filtros: estado, fecha)
- GET   /api/pedidos/:id             — detalle con renglones
- POST  /api/pedidos                 — crear (admin, tomador) — calcula total y suma a deuda
- PATCH /api/pedidos/:id/estado      — entregar (admin, repartidor)

### Cobros
- GET  /api/cobros                   — listar (admin, repartidor)
- POST /api/cobros                   — registrar (admin, repartidor) — abona a deuda

### Gastos
- GET    /api/gastos                 — listar (admin)
- POST   /api/gastos                 — registrar (admin)
- DELETE /api/gastos/:id             — eliminar (admin)

### Dashboard
- GET /api/dashboard?desde=&hasta=   — indicadores financieros (solo admin)

## Pruebas

```
node test/integration.test.js
```

Prueba de integracion del ciclo completo (precios -> pedido -> entrega ->
cobro -> gasto -> dashboard) y de la autorizacion por rol, usando SQLite
en memoria (sin requerir MySQL real). 15 verificaciones.

## Transacciones

Los pedidos y cobros usan transacciones (BEGIN/COMMIT/ROLLBACK) para
mantener la consistencia: un pedido inserta su detalle y ajusta la deuda
del cliente de forma atomica; si algo falla, se revierte todo.
