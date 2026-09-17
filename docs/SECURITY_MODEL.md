# Modelo de Seguridad y Firebase Rules

## Principios
1. **Denegar por defecto:** Todo acceso es rechazado si no coincide con una regla específica.
2. **Validación Multi-Tenant:** Ninguna operación de lectura/escritura en colecciones operativas puede ocurrir si el `request.resource.data.companyId` no coincide con una empresa donde el `request.auth.uid` tenga una `membership` válida.
3. **Validación de Roles (RBAC):** Ciertas operaciones requieren que el `role` en el `membership` contenga los permisos específicos.

## Firebase Authentication
Se utiliza como proveedor principal de identidad. Las contraseñas y credenciales están gestionadas por Firebase.

## Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Función de ayuda para validar membresía
    function getMembership(companyId) {
      return get(/databases/$(database)/documents/memberships/$(request.auth.uid + '_' + companyId)).data;
    }
    
    function isAuthorized(companyId, requiredPermission) {
      let mem = getMembership(companyId);
      // Aquí se debería verificar si el roleId asociado tiene el permiso.
      return mem != null; 
    }

    // Reglas para vehículos
    match /vehicles/{vehicleId} {
      allow read: if isAuthorized(resource.data.companyId, 'vehicles.view');
      allow create: if isAuthorized(request.resource.data.companyId, 'vehicles.create');
      allow update: if isAuthorized(resource.data.companyId, 'vehicles.edit');
      allow delete: if false; // Solo soft-delete o Platform Admin
    }
  }
}
```

## Roles de Sistema (Platform Admin)
Habrá una colección `platformAdmins` que otorgará permisos globales para soporte técnico o administración del SaaS, saltándose las reglas tenant-specific cuando sea necesario.
