import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '../../shared/layouts/AppLayout';
import { ProtectedRoute } from '../../core/auth/ProtectedRoute';
import { Login } from '../../modules/auth/Login';
import { RegisterCompany } from '../../modules/auth/RegisterCompany';
import { CustomerList } from '../../modules/customers/CustomerList';
import { FleetList } from '../../modules/fleet/FleetList';
import { ContractList } from '../../modules/contracts/ContractList';
import { ContractTemplateList } from '../../modules/contracts/templates/ContractTemplateList';
import { PaymentsList } from '../../modules/finances/PaymentsList';
import { ExpenseList } from '../../modules/finances/ExpenseList';
import { FinancialDashboard } from '../../modules/finances/FinancialDashboard';
import { Dashboard } from '../../modules/dashboard/Dashboard';
import { ReservationCalendar } from '../../modules/reservations/ReservationCalendar';
import { CheckInOutPanel } from '../../modules/operations/CheckInOutPanel';
import { MaintenancePanel } from '../../modules/fleet/MaintenancePanel';
import { PublicLayout } from '../../shared/layouts/PublicLayout';
import { BookingPortal } from '../../modules/public/BookingPortal';
import { CompanyDirectory } from '../../modules/public/CompanyDirectory';
import { CashRegisterPanel } from '../../modules/finances/CashRegisterPanel';
import { InvoicingPanel } from '../../modules/finances/InvoicingPanel';

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
    path: '/portal',
    element: <CompanyDirectory />,
  },
  {
    path: '/:companyId/book',
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: <BookingPortal />
      }
    ]
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
            element: <Dashboard />,
          },
          {
            path: 'customers',
            element: <CustomerList />,
          },
          {
            path: 'reservations',
            element: <ReservationCalendar />,
          },
          {
            path: 'operations',
            element: <CheckInOutPanel />,
          },
          {
            path: 'fleet',
            element: <FleetList />,
          },
          {
            path: 'fleet/maintenance',
            element: <MaintenancePanel />,
          },
          {
            path: 'contracts',
            element: <ContractList />,
          },
          {
            path: 'contracts/templates',
            element: <ContractTemplateList />,
          },
          {
            path: 'finances/overview',
            element: <FinancialDashboard />,
          },
          {
            path: 'finances/payments',
            element: <PaymentsList />,
          },
          {
            path: 'finances/cash',
            element: <CashRegisterPanel />,
          },
          {
            path: 'finances/invoicing',
            element: <InvoicingPanel />,
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
