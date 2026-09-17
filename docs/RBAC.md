# Roles y Permisos (RBAC)

## Roles Base del Sistema
1. **Platform Super Admin:** Control total de la plataforma SaaS (todas las empresas).
2. **Company Administrator:** Acceso completo dentro de un Tenant específico (`companyId`).
3. **Gerente:** Acciones gerenciales, reportes financieros y operacionales, anulaciones.
4. **Reservaciones:** Crear, modificar y cancelar reservas. Acceso a vista de vehículos.
5. **Rentas (Operaciones):** Apertura de contratos, check-in, check-out, registro de daños.
6. **Caja:** Recibir pagos, devolver depósitos, abrir y cerrar caja.
7. **Flota / Mantenimiento:** Gestionar estados de vehículos, mantenimiento preventivo y correctivo, proveedores de taller.
8. **Contabilidad:** Visualizar facturas, registrar gastos, cuadres.
9. **Consulta:** Solo lectura en los módulos pertinentes.

## Permisos Clave
- `customers.view`, `customers.create`, `customers.edit`
- `vehicles.view`, `vehicles.create`, `vehicles.edit`, `vehicles.changeStatus`
- `reservations.view`, `reservations.create`, `reservations.edit`, `reservations.cancel`
- `contracts.view`, `contracts.create`, `contracts.edit`, `contracts.close`
- `invoices.view`, `invoices.create`, `invoices.cancel`
- `payments.view`, `payments.create`
- `cash.open`, `cash.close`, `cash.view`
- `maintenance.view`, `maintenance.create`, `maintenance.close`
- `reports.view`, `reports.export`
- `settings.view`, `settings.edit`

## Implementación
El frontend debe envolver las acciones con componentes estilo `<RequirePermission permission="vehicles.edit">` para ocultar botones o rutas que el usuario no tiene permitido ejecutar. NO depender solo del frontend, las Firestore Security Rules y Cloud Functions validarán siempre los permisos en el backend.
