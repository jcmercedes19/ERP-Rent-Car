# Roadmap de Desarrollo

## FASE 0: ARQUITECTURA (Actual)
- [x] Generación de documentación base (Arquitectura, Seguridad, Multi-Tenant, BD).
- [x] Definición de modelo de datos, seguridad, y reglas de negocio.
- [ ] Presentar y validar la arquitectura con el usuario.

## FASE 1: FUNDACIÓN
- Configuración de Vite, React, TypeScript y Tailwind CSS o similar.
- Integración de Firebase SDK (Auth, Firestore, Hosting).
- Sistema de autenticación (Login, Registro, Recuperación).
- Lógica de Multi-Tenant (Company, Branch, User, Membership).
- Sistema de enrutamiento con guards (RBAC).
- Implementación de estado global (Zustand) para control de contexto (tenant activo).

## FASE 2: CLIENTES Y FLOTA
- Módulo de Clientes (CRM, CRUD, expedientes 360).
- Módulo de Vehículos (Marcas, modelos, categorías, CRUD).
- Tablero de Disponibilidad y control de estados de vehículos.

## FASE 3: RENTAL CORE
- Motor de Tarifas y Extras.
- Cotizaciones y Reservaciones (Vista de Calendario).
- Contratos (Generación, pre-aprobación).
- Flujo de Check-out y Check-in (Proceso de entrega, recepción e inspección digital de daños).

## FASE 4: FINANZAS
- Facturación base y adecuación a NCF / e-NCF (República Dominicana).
- Pagos, manejo de Depósitos de garantía.
- Operaciones de Caja y Gastos.

## FASE 5: FLEET MANAGEMENT
- Gestión de Mantenimiento y órdenes de trabajo en taller.
- Combustible y Neumáticos.
- Gestión de Seguros, Accidentes, Multas y Peajes.
- Logística interna (Traslados de vehículos entre sucursales).

## FASE 6: ANALYTICS
- Dashboard avanzado y dinámico (Widgets según rol).
- Reportes operativos, financieros y de rentabilidad exportables.

## FASE 7: ECOSISTEMA Y EXPANSIÓN
- Portal "Self-Service" para clientes.
- Integraciones API: GPS, firmas digitales, WhatsApp, Push Notifications, portal web público de reservas.
