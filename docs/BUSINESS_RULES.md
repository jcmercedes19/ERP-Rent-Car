# Reglas de Negocio

## Flujo de Vehículos y Estados
- **AVAILABLE:** Listo para rentar.
- **RESERVED:** Asignado a una reserva futura, pero físicamente disponible.
- **RENTED:** Entregado al cliente (Contrato Activo).
- **DELIVERY:** En proceso de ser entregado a una ubicación.
- **RETURNING:** En proceso de devolución.
- **MAINTENANCE:** En mantenimiento preventivo/correctivo.
- **REPAIR:** En reparación (ej. accidente o daño mayor).
- **ACCIDENT:** Siniestrado.
- **OUT_OF_SERVICE:** Baja temporal.
- **SOLD:** Baja definitiva.

**Transiciones Críticas:**
- Un vehículo en `RENTED` no puede pasar a `AVAILABLE` automáticamente. Al cerrarse el contrato debe requerir inspección.
- La confirmación de una reserva (Check-out) cambia el vehículo de `RESERVED` a `RENTED`.

## Reservaciones vs Contratos
- Una **Reservación** es un compromiso futuro.
- Un **Contrato** es el acuerdo legal firmado cuando el vehículo se entrega (Check-out).
- Un vehículo reservado NO está alquilado.

## Finanzas y Caja
- El **Depósito de Garantía** es un pasivo, no un ingreso. Si el vehículo regresa sin daños, se devuelve total o parcialmente.
- Una **Factura** puede tener múltiples cargos (alquiler base, extras, daños, combustible faltante, multas).
- Las **Anulaciones** deben requerir un permiso especial (Gerente / Administrador) y registrar un motivo para la auditoría.
- La facturación debe estar preparada para el esquema de **NCF / e-NCF (República Dominicana)**.

## Expedientes 360°
- **Cliente:** Vista de reservas pasadas, daños asociados, pagos, multas.
- **Vehículo:** Vista consolidada de ingresos vs costos de mantenimiento y eventual depreciación.

## Multi-Sucursal
- Los vehículos pueden ser trasladados (cambio de `branchOrigin` a `branchDestination`).
- El inventario disponible depende de la sucursal activa seleccionada por el operador.
