# Frutería OS

Sistema operativo para una distribuidora de fruta y verdura.
Proyecto full-stack: React (frontend) + Node.js/Express + MySQL (backend).

## Estructura

```
fruteria-os/
  server/   API REST en Express + MySQL (ver server/README.md)
  client/   Interfaz en React + Vite     (ver client/README.md)
```

## Puesta en marcha rápida

1. **Backend**: entra a `server/`, sigue su README (crear BD MySQL, seed, `npm run dev`).
2. **Frontend**: entra a `client/`, `npm install` y `npm run dev`.
3. Abre http://localhost:5173 e inicia sesión con una cuenta de demostración.

## Roles

- **admin** (Christian): acceso total — finanzas, precios, gastos, dashboard.
- **repartidor** (Chuy): pedidos, entregas, cobros.
- **tomador** (Alexa): pedidos, clientes.

## Módulos

Clientes (con deudores), productos y precios diarios (con margen y arrastre),
pedidos con detalle, cobros (abono a deuda), gastos, y dashboard financiero.
