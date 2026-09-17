# Arquitectura del Sistema: RentCar ERP

## 1. Stack Tecnológico
- **Frontend:** React, Vite, TypeScript.
- **Backend / Cloud:** Firebase (Authentication, Firestore, Storage, Cloud Functions, Hosting).
- **Estado:** Zustand.
- **Enrutamiento:** React Router.
- **Formularios:** React Hook Form.
- **Validación:** Zod.
- **Gráficos:** Recharts.

## 2. Estructura de Directorios (Frontend)
```text
src/
├── app/                  # Configuración global, providers, router y store principal
│   ├── router/
│   ├── providers/
│   └── store/
├── core/                 # Lógica de infraestructura y servicios transversales
│   ├── auth/
│   ├── permissions/
│   ├── firebase/
│   ├── notifications/
│   ├── pdf/
│   ├── validation/
│   └── utils/
├── modules/              # Módulos de negocio (autocontenidos)
│   ├── dashboard/
│   ├── companies/
│   ├── branches/
│   ├── users/
│   ├── customers/
│   ├── vehicles/
│   ├── vehicleCategories/
│   ├── reservations/
│   ├── ... (otros módulos)
├── shared/               # Componentes y utilidades compartidas
│   ├── components/
│   ├── layouts/
│   ├── forms/
│   ├── tables/
│   ├── modals/
│   └── hooks/
└── assets/               # Recursos estáticos (imágenes, iconos, etc.)
```

## 3. Principios de Diseño
- **Multi-Tenant Nativo:** Separación estricta de datos por empresa en Firestore (vía Security Rules y jerarquía de datos).
- **Seguridad por Defecto:** Las validaciones de acceso se hacen en Firebase Security Rules, el UI solo se adapta a lo que se permite hacer.
- **Componentización:** Reutilización de componentes en `shared/` para mantener una UI/UX consistente y profesional.
- **Carga Diferida:** Implementar code splitting mediante Vite y React Router para optimizar la carga de los módulos.
- **Estado Global vs Local:** Usar Zustand solo para el estado global (ej. sesión, tenant activo). Para el resto, estado local o herramientas tipo React Query para server state (aunque usaremos el SDK de Firebase de manera reactiva).
