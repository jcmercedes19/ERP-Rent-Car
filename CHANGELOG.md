# Changelog del Proyecto RentCar ERP

Este archivo documenta todos los cambios notables realizados en el proyecto. 
El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).

## [Unreleased]

### Added
- **Refactor Estructural (Fase 1)**: Inyección transversal de la entidad `Sucursal` (`branchId`) en el modelo de datos.
- Añadido `branchId` a las interfaces de `Vehicle`, `RentalContract`, `Reservation`, `CashTransaction`.
- Creado selector dinámico de Sucursal en el Header global (`AppLayout.tsx`) para usuarios `ADMIN`.
- Soporte para consultas particionadas por Sucursal en el estado local de Zustand (`useVehicleStore`, `useContractStore`, `useReservationStore`, `useCashStore`, `useFleetOpsStore`).
- **Modelo Multimoneda (Fase 1)**: Añadido `useCurrencyStore.ts` para manejar tasas de cambio dinámicas (DOP, USD, EUR).
- Añadidos campos `currency`, `originalAmount`, `exchangeRateAtCreation`, `baseCurrencyAmount` a los modelos `RentalContract` y `CashTransaction`.
- Actualizado `formatters.ts` para soportar códigos de moneda dinámicos en lugar de quemar `'DOP'`.

### Changed
- Refactorización de aislamiento `Tenant`: Decisión de arquitectura aprobada para mantener el filtro lógico por `companyId` (rendimiento y costos).

### Fixed
- Corregida la creación de Reservaciones desde el portal público (`BookingPortal.tsx`) para heredar automáticamente la sucursal del vehículo seleccionado.
- **Finanzas Fase 2 (NCF y Caja)**:
  - Implementada Cloud Function `generateNCF` transaccional para generación secuencial atómica del NCF y prevención de colisiones.
  - Creado `useCashSessionStore` para gestionar "Turnos de Caja" (`cashSessions`).
  - Actualizado `useCashStore` para que cada transacción actualice atómicamente el "Saldo Esperado" (Efectivo, Tarjeta, Transferencia) del turno activo.
  - Nuevo panel `CierreCaja.tsx` con tracking en vivo, arqueo detallado por método de pago, ingreso del desglose de denominaciones de billetes, y exportación automática a PDF (Pre-Reporte).
- **Operaciones Fase 2.3 (Pre-Check-In Digital)**:
  - Implementada Cloud Function `generatePreCheckInLink` para firmar URLs y habilitar accesos temporales.
  - Creado formulario público de `PreCheckInForm.tsx` con carga de documentos (Base64 -> Firebase Storage), firma digital y validación del Art. 32 del INTRANT.
  - Actualizado `CheckInOutPanel.tsx` con botón para enviar por WhatsApp y generar alertas visuales sobre la fecha de expiración de licencias de conducir.
