
import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '../../shared/layouts/AppLayout';
import { ProtectedRoute } from '../../core/auth/ProtectedRoute';
import { Login } from '../../modules/auth/Login';
import { RegisterCompany } from '../../modules/auth/RegisterCompany';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <RegisterCompany />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <div className="p-6 bg-white rounded-lg shadow"><h1>Dashboard (En construcción)</h1><p className="text-gray-500 mt-2">Bienvenido al ERP Multi-Tenant.</p></div>,
          },
        ],
      },
    ],
  },
]);
