# Esquema de Base de Datos (Cloud Firestore)

## Entidades de Configuración e Identidad
- `users`: Perfil de usuario (nombre, email, preferencias). No incluye lógica de permisos.
  - Document ID: `uid`
- `companies`: Perfil del tenant (razón social, configuración fiscal, logo).
  - Document ID: `companyId`
- `branches`: Sucursales de una empresa.
  - Path sugerido: `companies/{companyId}/branches/{branchId}`
- `memberships`: Asociación usuario-empresa-rol.
  - Document ID: `uid_companyId` (para búsqueda rápida)
  - Campos: `uid`, `companyId`, `roleId`, `branchIds` (arreglo de sucursales permitidas).
- `roles`: Definiciones de roles a nivel de empresa o globales.
  - Path: `companies/{companyId}/roles/{roleId}` o centralizados si son plantillas estándar.

## Entidades Operativas Principales (Nivel Raíz con `companyId`)
*Para facilitar consultas shallow y queries complejas, se recomiendan colecciones raíz con `companyId` indexado.*

- `customers`: Información CRM, documentos, historial.
- `vehicles`: Flota, estado, kilometraje, etc.
- `reservations`: Reservas de clientes.
- `rentalContracts`: Contratos activos o cerrados.
- `maintenanceOrders`: Órdenes preventivas y correctivas.
- `invoices`: Facturas generadas.
- `payments`: Pagos realizados.
- `expenses`: Gastos operativos.

## Subcolecciones Específicas
- `vehicles/{vehicleId}/damages`
- `vehicles/{vehicleId}/inspections`
- `rentalContracts/{contractId}/charges`

## Estructura de Documentos Clave
### Vehicle
```json
{
  "companyId": "...",
  "brand": "Toyota",
  "model": "Corolla",
  "year": 2025,
  "status": "AVAILABLE",
  "currentMileage": 15000,
  "category": "SEDAN",
  "createdAt": "timestamp"
}
```
### Contract
```json
{
  "companyId": "...",
  "customerId": "...",
  "vehicleId": "...",
  "status": "ACTIVE",
  "startDate": "...",
  "expectedReturnDate": "...",
  "totalAmount": 15000,
  "depositAmount": 5000
}
```
