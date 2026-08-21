import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from '../../lib/utils';
import type { NavSection, PermissionLevel } from '../../types';
import { Header } from './Header';
import { MobileBottomNav } from '../mobile/MobileBottomNav';
import { Sidebar, SidebarOverlay, MobileSidebarDrawer } from './Sidebar';

interface DashboardLayoutProps {
  sections: NavSection[];
  sharedProperties?: Array<{ id: string; title: string; permissionLevel: PermissionLevel }>;
  mobileNav?: 'broker' | 'buyer' | 'admin';
  headerSubtitle?: string;
  notificationsPath?: string;
}

export function DashboardLayout({
  sections,
  sharedProperties,
  mobileNav = 'broker',
  headerSubtitle,
  notificationsPath,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:block">
        <Sidebar sections={sections} sharedProperties={sharedProperties} />
      </div>

      <SidebarOverlay open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <MobileSidebarDrawer open={sidebarOpen} onClose={() => setSidebarOpen(false)}>
        <Sidebar
          sections={sections}
          sharedProperties={sharedProperties}
          onClose={() => setSidebarOpen(false)}
        />
      </MobileSidebarDrawer>

      <div className="flex flex-1 flex-col">
        <main className={cn('flex-1 overflow-y-auto p-4 pb-24 lg:p-8 lg:pb-8')}>
          <Header
            subtitle={headerSubtitle}
            onMenuClick={() => setSidebarOpen(true)}
            notificationsPath={notificationsPath}
          />
          <Outlet />
        </main>
        <MobileBottomNav variant={mobileNav} />
      </div>
    </div>
  );
}
