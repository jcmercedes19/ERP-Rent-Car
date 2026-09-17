import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '../../shared/layouts/AppLayout';
import { ProtectedRoute } from '../../core/auth/ProtectedRoute';
import { Login } from '../../modules/auth/Login';
import { RegisterCompany } from '../../modules/auth/RegisterCompany';
import { CustomerList } from '../../modules/customers/CustomerList';
import { FleetList } from '../../modules/fleet/FleetList';
import { ContractList } from '../../modules/contracts/ContractList';
import { PaymentsList } from '../../modules/finances/PaymentsList';
import { ExpenseList } from '../../modules/finances/ExpenseList';

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
          {
            path: 'customers',
            element: <CustomerList />,
          },
          {
            path: 'fleet',
            element: <FleetList />,
          },
          {
            path: 'contracts',
            element: <ContractList />,
          },
          {
            path: 'finances/payments',
            element: <PaymentsList />,
          },
          {
            path: 'finances/expenses',
            element: <ExpenseList />,
          },
        ],
      },
    ],
  },
]);
