# Modelo Multi-Tenant

## Estrategia
El ERP es un sistema SaaS B2B donde la "Empresa" es el Tenant principal. Un usuario no pertenece directamente a una empresa de forma exclusiva, sino a través de un documento de `membership` que asocia a un usuario con una empresa, sucursal y rol determinado.

## Jerarquía Conceptual
```text
Firebase Auth (UID)
      ↓
   users (Perfil de Usuario)
      ↓
 memberships (Tabla pivote: UID <-> CompanyId)
      ↓
 companies (Tenant)
      ↓
 branches (Sucursales)
```

## Aislamiento de Datos
Los datos operativos NUNCA se mezclan a nivel de subcolecciones si no es necesario, pero TODO documento operativo debe tener al menos el `companyId`.

Para optimizar las Firestore Security Rules y prevenir accesos cross-tenant, las colecciones principales (ej. `customers`, `vehicles`, `contracts`) pueden tener el `companyId` como atributo indexado, y las Reglas de Seguridad obligarán a que cualquier consulta o escritura pase la validación de pertenencia.

Ejemplo de validación en Security Rules (pseudocódigo):
```javascript
function isUserInCompany(companyId) {
  return exists(/databases/$(database)/documents/memberships/$(request.auth.uid + '_' + companyId));
}
```

## Selección de Contexto (Empresa Activa)
1. Al loguearse, el sistema consulta los `memberships` del usuario.
2. Si tiene 1, entra directamente asignando esa empresa en el Global Store (Zustand).
3. Si tiene >1, se presenta una pantalla "Seleccione una empresa".
4. Todas las lecturas y escrituras hacia Firestore incluirán automáticamente el `companyId` del estado global.
