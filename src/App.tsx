import { Navigate, Route, Routes } from 'react-router-dom';

import { DashboardRedirect, ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute';

import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { AuthCallbackPage } from './pages/auth/AuthCallbackPage';
import { AdminApprovedPage } from './pages/admin/ApprovedPage';
import { AdminDashboard } from './pages/admin/Dashboard';

import { AdminHome } from './pages/admin/Home';

import { AdminImportPage } from './pages/admin/ImportPage';

import { AdminPendingPage } from './pages/admin/PendingPage';

import { AdminPropertiesPage } from './pages/admin/PropertiesPage';

import { AdminRejectedPage } from './pages/admin/RejectedPage';

import { AdminSharesPage } from './pages/admin/SharesPage';

import { AdminSupportPage } from './pages/admin/SupportPage';

import { AdminUsersPage } from './pages/admin/UsersPage';

import { AgreementsPage } from './pages/broker/AgreementsPage';

import { AuctionsPage } from './pages/broker/AuctionsPage';

import { BrokerDashboard } from './pages/broker/Dashboard';

import { BrokerHome } from './pages/broker/Home';

import { LeadsPage } from './pages/broker/LeadsPage';

import { LeaseDetailPage } from './pages/broker/LeaseDetailPage';

import { LeasesPage } from './pages/broker/LeasesPage';

import { MyPropertiesPage } from './pages/broker/MyPropertiesPage';

import { NotificationsPage } from './pages/broker/NotificationsPage';

import { PaymentsPage } from './pages/broker/PaymentsPage';

import { ProfilePage } from './pages/broker/ProfilePage';

import { PropertiesPage } from './pages/broker/PropertiesPage';

import { PropertyDetailPage } from './pages/broker/PropertyDetailPage';

import { ReportsPage } from './pages/broker/ReportsPage';

import { SettingsPage } from './pages/broker/SettingsPage';

import { TasksPage } from './pages/broker/TasksPage';
import { TenantDetailPage } from './pages/broker/TenantDetailPage';

import { TenantsPage } from './pages/broker/TenantsPage';

import { UnitDetailPage } from './pages/broker/UnitDetailPage';

import { UnitsPage } from './pages/broker/UnitsPage';

import { BuyerDashboard } from './pages/buyer/Dashboard';

import { BuyerHome } from './pages/buyer/Home';

import { FavoritesPage } from './pages/buyer/FavoritesPage';

import { BuyerNotificationsPage } from './pages/buyer/NotificationsPage';

import { BuyerSearchPage } from './pages/buyer/SearchPage';

import { SharedPropertiesPage } from './pages/buyer/SharedPropertiesPage';

import { SharedPropertyDetailPage } from './pages/buyer/SharedPropertyDetailPage';

import { LandingPage } from './pages/landing/LandingPage';

import { AuctionsPublicPage } from './pages/market/AuctionsPublicPage';

import { CalculatorPage } from './pages/market/CalculatorPage';

import { DealsPage } from './pages/market/DealsPage';

import { MarketPage } from './pages/market/MarketPage';

import { OpportunitiesPage } from './pages/market/OpportunitiesPage';

import { PlayersPage } from './pages/market/PlayersPage';

import { PricesPage } from './pages/market/PricesPage';

import { SignPage } from './pages/sign/SignPage';



export function App() {

  return (

    <Routes>

      <Route path="/" element={<LandingPage />} />

      <Route path="/market" element={<MarketPage />} />

      <Route path="/auctions" element={<AuctionsPublicPage />} />

      <Route path="/deals" element={<DealsPage />} />

      <Route path="/players" element={<PlayersPage />} />

      <Route path="/opportunities" element={<OpportunitiesPage />} />

      <Route path="/calculator" element={<CalculatorPage />} />

      <Route path="/prices" element={<PricesPage />} />

      <Route path="/sign/:token" element={<SignPage />} />



      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      <Route path="/dashboard" element={<DashboardRedirect />} />



      <Route element={<ProtectedRoute allowedRoles={['broker', 'admin', 'superadmin', 'owner', 'manager', 'partner']} />}>

        <Route path="/broker" element={<BrokerDashboard />}>

          <Route index element={<BrokerHome />} />

          <Route path="my-properties" element={<MyPropertiesPage />} />

          <Route path="auctions" element={<AuctionsPage />} />

          <Route path="notifications" element={<NotificationsPage />} />

          <Route path="clients" element={<LeadsPage />} />

          <Route path="leads" element={<LeadsPage />} />

          <Route path="tasks" element={<TasksPage />} />

          <Route path="agreements" element={<AgreementsPage />} />

          <Route path="properties" element={<PropertiesPage />} />

          <Route path="properties/:id" element={<PropertyDetailPage />} />

          <Route path="units" element={<UnitsPage />} />

          <Route path="units/:id" element={<UnitDetailPage />} />

          <Route path="reports" element={<ReportsPage />} />

          <Route path="profile" element={<ProfilePage />} />

          <Route path="settings" element={<SettingsPage />} />

          <Route path="tenants" element={<TenantsPage />} />

          <Route path="tenants/:id" element={<TenantDetailPage />} />

          <Route path="leases" element={<LeasesPage />} />

          <Route path="leases/:id" element={<LeaseDetailPage />} />

          <Route path="payments" element={<PaymentsPage />} />

        </Route>

      </Route>



      <Route element={<ProtectedRoute allowedRoles={['buyer', 'admin', 'superadmin']} />}>

        <Route path="/buyer" element={<BuyerDashboard />}>

          <Route index element={<BuyerHome />} />

          <Route path="shared" element={<SharedPropertiesPage />} />

          <Route path="shared/:id" element={<SharedPropertyDetailPage />} />

          <Route path="search" element={<BuyerSearchPage />} />

          <Route path="favorites" element={<FavoritesPage />} />

          <Route path="notifications" element={<BuyerNotificationsPage />} />

          <Route path="settings" element={<SettingsPage variant="buyer" />} />

        </Route>

      </Route>



      <Route element={<ProtectedRoute allowedRoles={['admin', 'superadmin']} />}>

        <Route path="/admin" element={<AdminDashboard />}>

          <Route index element={<AdminHome />} />

          <Route path="properties" element={<AdminPropertiesPage />} />

          <Route path="users" element={<AdminUsersPage />} />

          <Route path="shares" element={<AdminSharesPage />} />

          <Route path="support" element={<AdminSupportPage />} />

          <Route path="import" element={<AdminImportPage />} />

          <Route path="pending" element={<AdminPendingPage />} />

          <Route path="approved" element={<AdminApprovedPage />} />

          <Route path="rejected" element={<AdminRejectedPage />} />

          <Route path="settings" element={<SettingsPage variant="admin" />} />

          <Route path="notifications" element={<NotificationsPage />} />

        </Route>

      </Route>



      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>

  );

}

