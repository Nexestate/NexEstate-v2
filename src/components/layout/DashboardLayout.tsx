import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useRealtimeNotifications } from '../../hooks/useRealtimeNotifications';
import { QuickAddProvider } from '../../contexts/QuickAddContext';
import { EntityDetailProvider } from '../../contexts/EntityDetailContext';
import { cn } from '../../lib/utils';
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
    if (sidebarOpen) document.body.classList.add('mobile-menu-open');
    else document.body.classList.remove('mobile-menu-open');
    return () => document.body.classList.remove('mobile-menu-open');
  }, [sidebarOpen]);

  const header = (
    <Header
      subtitle={headerSubtitle}
      onMenuClick={() => setSidebarOpen(true)}
      notificationsPath={notificationsPath}
      className="pb-0 lg:pb-6"
    />
  );

  return (
    <QuickAddProvider>
      <EntityDetailProvider>
        <div className="flex min-h-[100dvh] min-w-0 bg-background">
          <div className="sticky top-0 hidden h-[100dvh] shrink-0 lg:block">
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
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="sticky top-0 z-30 shrink-0 border-b border-border bg-background/95 p-4 backdrop-blur lg:hidden">
              {header}
            </div>
            <main className="flex min-w-0 flex-1 flex-col overflow-y-auto overscroll-contain">
              <div className="hidden px-8 pt-8 lg:block">{header}</div>
              <div className="p-4 pb-28 lg:p-8 lg:pb-8">
                <Outlet />
              </div>
            </main>
            <MobileBottomNav variant={bottomNav} />
          </div>
        </div>
        <QuickAddModals />
        <EntityDetailModal />
      </EntityDetailProvider>
    </QuickAddProvider>
  );
}