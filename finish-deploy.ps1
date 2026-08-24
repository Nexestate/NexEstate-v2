# Overwrite DashboardLayout.tsx (clean), build, commit, rebase, push.
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$env:GIT_PAGER = 'cat'
$env:GIT_EDITOR = 'true'

$layoutPath = Join-Path $PSScriptRoot 'src\components\layout\DashboardLayout.tsx'
$clean = @'
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

  return (
    <QuickAddProvider>
      <EntityDetailProvider>
        <div className="flex min-h-[100dvh] min-w-0 bg-background">
          <div className="hidden lg:block">
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
            <main
              className={cn(
                'flex min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto p-4 pb-24 lg:p-8 lg:pb-8',
              )}
            >
              <Header
                subtitle={headerSubtitle}
                onMenuClick={() => setSidebarOpen(true)}
                notificationsPath={notificationsPath}
              />
              <Outlet />
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
'@
[IO.File]::WriteAllText($layoutPath, $clean.Replace("`n", "`r`n"))
Write-Host 'Wrote clean DashboardLayout.tsx' -ForegroundColor Green

Write-Host '=== npm run build ===' -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host '=== git add + commit ===' -ForegroundColor Cyan
git add -- src/components/layout/DashboardLayout.tsx src/components/broker/EntityDetailModal.tsx src/contexts/EntityDetailContext.tsx
$staged = @(git --no-pager diff --cached --name-only)
git --no-pager diff --cached --stat
if ($staged.Count -gt 0) {
  git -c user.email="nexuservice@gmail.com" -c user.name="Michael Wiener" commit -m "Fix DashboardLayout merge so production can build"
} else {
  Write-Host 'No layout diff to commit (already clean in git).' -ForegroundColor Yellow
}

Write-Host '=== pull --rebase ===' -ForegroundColor Cyan
git pull --rebase origin main
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host '=== push ===' -ForegroundColor Cyan
git push origin main
if ($LASTEXITCODE -ne 0) { exit 1 }
Write-Host 'Done. Check Vercel for Ready.' -ForegroundColor Green
