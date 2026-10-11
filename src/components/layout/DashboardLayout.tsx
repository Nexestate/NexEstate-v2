import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useRealtimeNotifications } from '../../hooks/useRealtimeNotifications';
import { QuickAddProvider } from '../../contexts/QuickAddContext';
import { EntityDetailProvider } from '../../contexts/EntityDetailContext';
import type { NavSection, PermissionLevel } from '../../types';
import { EntityDetailModal } from '../broker/EntityDetailModal';
import { QuickAddModals } from '../broker/QuickAddModals';
import { Header } from './Header';
import { MobileBottomNav } from '../mobile/MobileBottomNav';
import { Sidebar, SidebarOverlay, MobileSidebarDrawer } from './Sidebar';

interface DashboardLayoutProps {
  sections: NavSection[];
  managedProperties?: import('../../lib/services/brokerStatsService').ManagedPropertySidebarItem[];
  managedPropertiesLoading?: boolean;
  sharedProperties?: Array<{ id: string; title: string; permissionLevel: PermissionLevel }>;
  mobileNav?: 'broker' | 'buyer' | 'admin' | 'partner';
  headerSubtitle?: string;
  notificationsPath?: string;
}

export function DashboardLayout({
  sections,
  managedProperties,
  sharedProperties,
  mobileNav = 'broker',
  headerSubtitle,
  notificationsPath,
}: DashboardLayoutProps) {
  const bottomNav = mobileNav === 'partner' ? 'broker' : mobileNav;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  useRealtimeNotifications(user?.id);

  useEffect(() => {
    document.documentElement.classList.add('dashboard-shell');
    return () => document.documentElement.classList.remove('dashboard-shell');
  }, []);

  useEffect(() => {
    if (sidebarOpen) document.body.classList.add('mobile-menu-open');
    else document.body.classList.remove('mobile-menu-open');
    return () => document.body.classList.remove('mobile-menu-open');
  }, [sidebarOpen]);

  const header = (
    <Header
      subtitle={headerSubtitle}
      onMenuClick={() => setSidebarOpen(true)}
      notificationsPath={notificationsPath}
      className="pb-0 lg:pb-2"
    />
  );

  return (
    <QuickAddProvider>
      <EntityDetailProvider userId={user?.id}>
        <div className="flex h-[100dvh] min-h-0 min-w-0 overflow-hidden bg-shell">
          <div className="hidden h-full shrink-0 shadow-2xl shadow-black/40 ring-1 ring-white/5 lg:block">
            <Sidebar
              sections={sections}
              managedProperties={managedProperties}
              sharedProperties={sharedProperties}
            />
          </div>

          <SidebarOverlay open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <MobileSidebarDrawer open={sidebarOpen} onClose={() => setSidebarOpen(false)}>
            <Sidebar
              sections={sections}
              managedProperties={managedProperties}
              sharedProperties={sharedProperties}
              onClose={() => setSidebarOpen(false)}
            />
          </MobileSidebarDrawer>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-2 sm:p-3 lg:pe-4 lg:ps-2 lg:pt-3 lg:pb-3">
            <div className="workspace-frame elevation-shell flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl lg:rounded-3xl">
              <div className="z-30 shrink-0 border-b border-border/80 bg-workspace/90 px-4 py-4 backdrop-blur-md lg:hidden">
                {header}
              </div>

              <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                <div className="hidden px-6 pt-8 lg:block lg:px-10">{header}</div>
                <div className="p-4 pb-28 sm:p-6 lg:px-10 lg:pb-10 lg:pt-4">
                  <Outlet />
                </div>
              </main>

              <MobileBottomNav variant={bottomNav} />
            </div>
          </div>
        </div>
        <QuickAddModals />
        <EntityDetailModal />
      </EntityDetailProvider>
    </QuickAddProvider>
  );
}
