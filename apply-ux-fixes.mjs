import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const logPath = path.join(root, 'src', 'deploy-status.md');
fs.mkdirSync(path.dirname(logPath), { recursive: true });
fs.writeFileSync(logPath, '# deploy status\n\n');
function log(msg) {
  const line = String(msg);
  console.log(line);
  fs.appendFileSync(logPath, line + '\n');
}

function abs(rel) {
  return path.join(root, rel);
}

function writeFile(rel, content) {
  fs.mkdirSync(path.dirname(abs(rel)), { recursive: true });
  fs.writeFileSync(abs(rel), content.replace(/\n/g, '\r\n'), 'utf8');
  log('wrote ' + rel);
}

function read(rel) {
  return fs.readFileSync(abs(rel), 'utf8');
}

function patch(rel, transform) {
  const file = abs(rel);
  if (!fs.existsSync(file)) {
    log('missing ' + rel);
    return false;
  }
  const before = read(rel);
  const after = transform(before);
  if (after === before) {
    log('unchanged ' + rel);
    return false;
  }
  fs.writeFileSync(abs(rel), after, 'utf8');
  log('patched ' + rel);
  return true;
}

function ensureImport(src, statement) {
  if (src.includes(statement)) return src;
  const lines = src.split(/\r?\n/);
  let lastImport = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('import ')) lastImport = i;
  }
  lines.splice(lastImport + 1, 0, statement);
  return lines.join('\n');
}

writeFile(
  'src/components/ui/BackButton.tsx',
  `import { ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Button } from './Button';

interface BackButtonProps {
  to?: string;
  label?: string;
  className?: string;
}

export function BackButton({ to, label = 'חזרה', className }: BackButtonProps) {
  const navigate = useNavigate();

  if (to) {
    return (
      <Link
        to={to}
        className={cn(
          'inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary',
          className,
        )}
      >
        <ArrowRight className="h-4 w-4" />
        {label}
      </Link>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn('-me-2 gap-1.5 px-2 text-muted-foreground hover:text-primary', className)}
      onClick={() => navigate(-1)}
    >
      <ArrowRight className="h-4 w-4" />
      {label}
    </Button>
  );
}
`,
);

writeFile(
  'src/components/broker/EntityLinkButton.tsx',
  `import { cn } from '../../lib/utils';

interface EntityLinkButtonProps {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick: () => void;
}

export function EntityLinkButton({ children, className, disabled, onClick }: EntityLinkButtonProps) {
  if (disabled) {
    return <span className="text-muted-foreground">{children}</span>;
  }

  return (
    <button
      type="button"
      className={cn('text-primary hover:underline', className)}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {children}
    </button>
  );
}
`,
);

writeFile(
  'src/components/layout/DashboardLayout.tsx',
  `import { useEffect, useState } from 'react';
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
      <EntityDetailProvider userId={user?.id}>
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
            <div
              className={cn(
                'sticky top-0 z-30 shrink-0 border-b border-border bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden',
              )}
            >
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
`,
);

patch('src/contexts/EntityDetailContext.tsx', (src) => {
  if (src.includes('userId?: string')) return src;
  return src
    .replace(
      'export function EntityDetailProvider({ children }: { children: ReactNode }) {',
      `export function EntityDetailProvider({
  children,
  userId,
}: {
  children: ReactNode;
  userId?: string;
}) {`,
    )
    .replace('(await fetchTenants()).find', '(await fetchTenants(userId)).find')
    .replace('  }, []);\n\n  const openLeaseById', '  }, [userId]);\n\n  const openLeaseById')
    .replace('(await fetchLeases()).find', '(await fetchLeases(userId)).find')
    .replace('  }, []);\n\n  const openPaymentById', '  }, [userId]);\n\n  const openPaymentById');
});

patch('src/components/mobile/MobileBottomNav.tsx', (src) => {
  let out = src;
  out = out.replace(/\n  const \[visible, setVisible\] = useState\(true\);\n  const lastScrollY = useRef\(0\);\n/, '\n');
  out = out.replace(/import \{ useEffect, useRef, useState \} from 'react';/, "import { useEffect, useState } from 'react';");
  out = out.replace(
    /\n  useEffect\(\(\) => \{\n    const scrollRoot = document\.querySelector\('main'\);[\s\S]*?\n  \}, \[location\.pathname\]\);\n/,
    '\n',
  );
  out = out.replace(
    /'fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card\/95 backdrop-blur transition-transform duration-300 lg:hidden',\n\s+'pb-\[max\(0\.5rem,env\(safe-area-inset-bottom\)\)\]',\n\s+visible \? 'translate-y-0' : 'translate-y-full',/,
    `'fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur lg:hidden',\n          'pb-[max(0.5rem,env(safe-area-inset-bottom))]',`,
  );
  return out;
});

patch('src/pages/broker/UnitsPage.tsx', (src) => {
  let out = src;
  out = ensureImport(out, "import { EntityLinkButton } from '../../components/broker/EntityLinkButton';");
  out = ensureImport(out, "import { stopRowClick } from '../../components/broker/EntityDetailModal';");
  out = ensureImport(out, "import { BackButton } from '../../components/ui/BackButton';");
  out = ensureImport(out, "import { useEntityDetail } from '../../contexts/EntityDetailContext';");
  if (!out.includes('openTenantById')) {
    out = out.replace(
      '  const { openQuickAdd } = useQuickAdd();\n',
      `  const { openQuickAdd } = useQuickAdd();\n  const { openUnit, openUnitById, openTenantById, openLeaseById } = useEntityDetail();\n`,
    );
  }
  if (!out.includes('openUnit({') && out.includes('const units = useMemo')) {
    out = out.replace(
      '  const propertyTitle = propertyFilter',
      `  useEffect(() => {
    if (!openId || loading) return;
    const unit = units.find((u) => u.id === openId);
    if (unit) {
      openUnit({ ...unit, propertyTitle: unit.propertyTitle, property_id: unit.property_id });
      return;
    }
    if (propertyFilter) void openUnitById(propertyFilter, openId);
  }, [openId, units, loading, propertyFilter, openUnit, openUnitById]);

  const propertyTitle = propertyFilter`,
    );
  }
  if (!out.includes('<BackButton') && out.includes('return (\n    <div className="space-y-6">')) {
    out = out.replace(
      '    <div className="space-y-6">\n      <div className="flex flex-wrap items-start justify-between gap-4">',
      `    <div className="space-y-6">
      {propertyFilter && (
        <BackButton to="/broker/units" label="חזרה לכל היחידות" />
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">`,
    );
  }
  out = out.replace(
    /<TableRow\n\s+key=\{unit\.id\}\n\s+className=\{openId === unit\.id \? 'bg-primary\/5 ring-1 ring-primary\/30' : undefined\}\n\s+>/,
    `<TableRow
                key={unit.id}
                className={\`cursor-pointer \${openId === unit.id ? 'bg-primary/5 ring-1 ring-primary/30' : ''}\`}
                onClick={() => openUnit({ ...unit, propertyTitle: unit.propertyTitle, property_id: unit.property_id })}
              >`,
  );
  out = out.replace(
    /\{unit\.tenant_id \? \(\s*<Link\s+to=\{`\/broker\/tenants\?property=\$\{unit\.property_id\}&open=\$\{unit\.tenant_id\}`\}\s+className="text-primary hover:underline"\s*>\s*\{unit\.tenant_name\}\s*<\/Link>\s*\) : \(\s*'—'\s*\)\}/g,
    `{unit.tenant_id ? (
                    <EntityLinkButton onClick={() => void openTenantById(unit.tenant_id!)}>
                      {unit.tenant_name}
                    </EntityLinkButton>
                  ) : (
                    '—'
                  )}`,
  );
  out = out.replace(
    /\{unit\.lease_id \? \(\s*<Link\s+to=\{`\/broker\/leases\?property=\$\{unit\.property_id\}&open=\$\{unit\.lease_id\}`\}\s+className="text-primary hover:underline"\s*>\s*צפייה\s*<\/Link>\s*\) : \(\s*'—'\s*\)\}/g,
    `{unit.lease_id ? (
                    <EntityLinkButton onClick={() => void openLeaseById(unit.lease_id!)}>
                      צפייה
                    </EntityLinkButton>
                  ) : (
                    '—'
                  )}`,
  );
  out = out.replace(
    /onClick=\{\(\) => setEditingUnit\(unit\)\}/g,
    `onClick={(e) => {
                      e.stopPropagation();
                      setEditingUnit(unit);
                    }}`,
  );
  return out;
});

patch('src/pages/broker/LeasesPage.tsx', (src) => {
  let out = src;
  out = ensureImport(out, "import { EntityLinkButton } from '../../components/broker/EntityLinkButton';");
  out = ensureImport(out, "import { BackButton } from '../../components/ui/BackButton';");
  out = ensureImport(out, "import { useEntityDetail } from '../../contexts/EntityDetailContext';");
  if (!out.includes('openTenantById')) {
    out = out.replace(
      '  const { user } = useAuth();\n',
      `  const { user } = useAuth();\n  const { openLease, openTenant, openLeaseById, openTenantById, openUnitById } = useEntityDetail();\n`,
    );
  }
  if (!out.includes('openTenant(tenant)') && out.includes('const propertyTitle = propertyFilter')) {
    out = out.replace(
      '  const propertyTitle = propertyFilter',
      `  useEffect(() => {
    if (!openId || loading) return;
    const tenant = tenants.find((t) => t.id === openId);
    if (tenant) {
      openTenant(tenant);
      return;
    }
    const lease = leases.find((l) => l.id === openId);
    if (lease) {
      openLease(lease);
      return;
    }
    void openTenantById(openId).then(() => openLeaseById(openId));
  }, [openId, loading, leases, tenants, openLease, openTenant, openTenantById, openLeaseById]);

  const propertyTitle = propertyFilter`,
    );
  }
  if (!out.includes('<BackButton')) {
    out = out.replace(
      '    <div className="space-y-6">\n      <div>',
      `    <div className="space-y-6">
      {propertyFilter && (
        <BackButton
          to={section === 'tenants' ? '/broker/tenants' : '/broker/leases'}
          label="חזרה לרשימה המלאה"
        />
      )}
      <div>`,
    );
  }
  out = out.replace(
    /<div key=\{lease\.id\} className="rounded-xl border border-border bg-card p-4">/,
    `<div
                key={lease.id}
                role="button"
                tabIndex={0}
                className="cursor-pointer rounded-xl border border-border bg-card p-4"
                onClick={() => openLease(lease)}
              >`,
  );
  out = out.replace(
    /<TableRow\n\s+key=\{lease\.id\}\n\s+className=\{openId === lease\.id \? 'bg-primary\/5 ring-1 ring-primary\/30' : undefined\}\n\s+>/,
    `<TableRow
                    key={lease.id}
                    className={\`cursor-pointer \${openId === lease.id ? 'bg-primary/5 ring-1 ring-primary/30' : ''}\`}
                    onClick={() => openLease(lease)}
                  >`,
  );
  out = out.replace(
    /<Link\s+to=\{`\/broker\/tenants\?property=\$\{lease\.property_id\}&open=\$\{lease\.tenant_id\}`\}\s+className="text-primary hover:underline"\s*>\s*\{lease\.tenant_name\}\s*<\/Link>/,
    `<EntityLinkButton onClick={() => void openTenantById(lease.tenant_id)}>
                        {lease.tenant_name}
                      </EntityLinkButton>`,
  );
  out = out.replace(
    /\{lease\.unit_id \? \(\s*<Link\s+to=\{`\/broker\/units\?property=\$\{lease\.property_id\}&open=\$\{lease\.unit_id\}`\}\s+className="text-primary hover:underline"\s*>\s*\{lease\.unit_number\}\s*<\/Link>\s*\) : \(\s*lease\.unit_number\s*\)\}/,
    `{lease.unit_id ? (
                        <EntityLinkButton onClick={() => void openUnitById(lease.property_id, lease.unit_id!)}>
                          {lease.unit_number}
                        </EntityLinkButton>
                      ) : (
                        lease.unit_number
                      )}`,
  );
  out = out.replace(
    /<TableRow\n\s+key=\{tenant\.id\}\n\s+className=\{openId === tenant\.id \? 'bg-primary\/5 ring-1 ring-primary\/30' : undefined\}\n\s+>/,
    `<TableRow
                key={tenant.id}
                className={\`cursor-pointer \${openId === tenant.id ? 'bg-primary/5 ring-1 ring-primary/30' : ''}\`}
                onClick={() => openTenant(tenant)}
              >`,
  );
  out = out.replace(
    /\{tenant\.unit_id && tenant\.property_id \? \(\s*<Link\s+to=\{`\/broker\/units\?property=\$\{tenant\.property_id\}&open=\$\{tenant\.unit_id\}`\}\s+className="text-primary hover:underline"\s*>\s*\{tenant\.unit_number \?\? '—'\}\s*<\/Link>\s*\) : \(\s*tenant\.unit_number \?\? '—'\s*\)\}/,
    `{tenant.unit_id && tenant.property_id ? (
                    <EntityLinkButton onClick={() => void openUnitById(tenant.property_id!, tenant.unit_id!)}>
                      {tenant.unit_number ?? '—'}
                    </EntityLinkButton>
                  ) : (
                    tenant.unit_number ?? '—'
                  )}`,
  );
  out = out.replace(
    /\{tenant\.lease_id && tenant\.property_id \? \(\s*<Link\s+to=\{`\/broker\/leases\?property=\$\{tenant\.property_id\}&open=\$\{tenant\.lease_id\}`\}\s+className="text-primary hover:underline"\s*>\s*צפייה\s*<\/Link>\s*\) : \(\s*'—'\s*\)\}/,
    `{tenant.lease_id ? (
                    <EntityLinkButton onClick={() => void openLeaseById(tenant.lease_id!)}>
                      צפייה
                    </EntityLinkButton>
                  ) : (
                    '—'
                  )}`,
  );
  return out;
});

patch('src/pages/broker/PaymentsPage.tsx', (src) => {
  let out = src;
  out = ensureImport(out, "import { BackButton } from '../../components/ui/BackButton';");
  out = ensureImport(out, "import { EntityLinkButton } from '../../components/broker/EntityLinkButton';");
  out = ensureImport(out, "import { useEntityDetail } from '../../contexts/EntityDetailContext';");
  if (!out.includes('openTenantById')) {
    out = out.replace(
      "  const [searchParams] = useSearchParams();\n",
      `  const [searchParams] = useSearchParams();\n  const { openPayment, openPaymentById, openTenantById, openUnitById, openLeaseById } = useEntityDetail();\n`,
    );
  }
  if (!out.includes("searchParams.get('open')")) {
    out = out.replace(
      "  const propertyFilter = searchParams.get('property');\n",
      `  const propertyFilter = searchParams.get('property');\n  const openId = searchParams.get('open');\n`,
    );
  }
  if (!out.includes('openPayment(') && out.includes('if (loading) return <PageLoader />')) {
    out = out.replace(
      '  if (loading) return <PageLoader />;',
      `  if (false) openPaymentById('');
  if (loading) return <PageLoader />;`,
    );
    // insert proper effect before loader
    out = out.replace(
      `  if (false) openPaymentById('');
  if (loading) return <PageLoader />;`,
      `  if (loading) return <PageLoader />;`,
    );
  }
  if (!out.includes('useEffect') && out.includes("from 'react'")) {
    out = out.replace(
      "import { useCallback, useMemo, useState } from 'react';",
      "import { useCallback, useEffect, useMemo, useState } from 'react';",
    );
  }
  if (!out.includes('openPayment(payment)') && out.includes('if (loading) return <PageLoader />')) {
    out = out.replace(
      '  if (loading) return <PageLoader />;',
      `  useEffect(() => {
    if (!openId || loading || !payments) return;
    const payment = payments.find((p) => p.id === openId);
    if (payment) openPayment(payment);
    else void openPaymentById(openId);
  }, [openId, loading, payments, openPayment, openPaymentById]);

  if (loading) return <PageLoader />;`,
    );
  }
  if (!out.includes('<BackButton')) {
    out = out.replace(
      '    <div className="space-y-6">\n      <PageHeader',
      `    <div className="space-y-6">
      {propertyFilter && <BackButton to="/broker/payments" label="חזרה לכל התשלומים" />}
      <PageHeader`,
    );
  }
  out = out.replace(/<TableRow key=\{p\.id\}>/, `<TableRow key={p.id} className="cursor-pointer" onClick={() => openPayment(p)}>`);
  out = out.replace(
    /\{p\.tenant_id && p\.property_id \? \(\s*<Link\s+to=\{`\/broker\/tenants\?property=\$\{p\.property_id\}&open=\$\{p\.tenant_id\}`\}\s+className="text-primary hover:underline"\s*>\s*\{p\.tenant_name\}\s*<\/Link>\s*\) : \(\s*p\.tenant_name\s*\)\}/,
    `{p.tenant_id ? (
                  <EntityLinkButton onClick={() => void openTenantById(p.tenant_id!)}>
                    {p.tenant_name}
                  </EntityLinkButton>
                ) : (
                  p.tenant_name
                )}`,
  );
  out = out.replace(
    /\{p\.unit_id && p\.property_id \? \(\s*<Link\s+to=\{`\/broker\/units\?property=\$\{p\.property_id\}&open=\$\{p\.unit_id\}`\}\s+className="text-primary hover:underline"\s*>\s*\{p\.unit_number\}\s*<\/Link>\s*\) : \(\s*p\.unit_number\s*\)\}/,
    `{p.unit_id && p.property_id ? (
                  <EntityLinkButton onClick={() => void openUnitById(p.property_id!, p.unit_id!)}>
                    {p.unit_number}
                  </EntityLinkButton>
                ) : (
                  p.unit_number
                )}`,
  );
  out = out.replace(
    /\{p\.lease_id && p\.property_id \? \(\s*<Link\s+to=\{`\/broker\/leases\?property=\$\{p\.property_id\}&open=\$\{p\.lease_id\}`\}\s+className="text-primary hover:underline"\s*>\s*צפייה\s*<\/Link>\s*\) : \(\s*'—'\s*\)\}/,
    `{p.lease_id ? (
                  <EntityLinkButton onClick={() => void openLeaseById(p.lease_id!)}>
                    צפייה
                  </EntityLinkButton>
                ) : (
                  '—'
                )}`,
  );
  return out;
});

patch('src/components/broker/ManagedUnitsTable.tsx', (src) => {
  let out = src;
  out = ensureImport(out, "import { EntityLinkButton } from './EntityLinkButton';");
  out = ensureImport(out, "import { useEntityDetail } from '../../contexts/EntityDetailContext';");
  out = ensureImport(out, "import { stopRowClick } from './EntityDetailModal';");
  if (!out.includes('openTenantById')) {
    out = out.replace(
      '}: ManagedUnitsTableProps) {\n  return (',
      `}: ManagedUnitsTableProps) {
  const { openUnit, openTenantById, openLeaseById } = useEntityDetail();
  return (`,
    );
  }
  out = out.replace(
    /<TableRow\n\s+key=\{unit\.id\}\n\s+className=\{highlightUnitId === unit\.id \? 'bg-primary\/5 ring-1 ring-primary\/30' : undefined\}\n\s+>/,
    `<TableRow
            key={unit.id}
            className={\`cursor-pointer \${highlightUnitId === unit.id ? 'bg-primary/5 ring-1 ring-primary/30' : ''}\`}
            onClick={() => openUnit({ ...unit, propertyTitle: unit.unit_number, property_id: propertyId })}
          >`,
  );
  out = out.replace(
    /<Link\s+to=\{`\/broker\/units\?property=\$\{propertyId\}&open=\$\{unit\.id\}`\}\s+className="text-primary hover:underline"\s*>\s*\{unit\.unit_number\}\s*<\/Link>/,
    `{unit.unit_number}`,
  );
  out = out.replace(
    /\{unit\.tenant_id \? \(\s*<Link\s+to=\{`\/broker\/tenants\?property=\$\{propertyId\}&open=\$\{unit\.tenant_id\}`\}\s+className="text-primary hover:underline"\s*>\s*\{unit\.tenant_name\}\s*<\/Link>\s*\) : \(\s*<span className="text-muted-foreground">—<\/span>\s*\)\}/,
    `{unit.tenant_id ? (
                <EntityLinkButton onClick={() => void openTenantById(unit.tenant_id!)}>
                  {unit.tenant_name}
                </EntityLinkButton>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}`,
  );
  out = out.replace(
    /\{unit\.lease_id \? \(\s*<Link\s+to=\{`\/broker\/leases\?property=\$\{propertyId\}&open=\$\{unit\.lease_id\}`\}\s+className="text-primary hover:underline"\s*>\s*צפייה\s*<\/Link>\s*\) : \(\s*<span className="text-muted-foreground">—<\/span>\s*\)\}/,
    `{unit.lease_id ? (
                <EntityLinkButton onClick={() => void openLeaseById(unit.lease_id!)}>
                  צפייה
                </EntityLinkButton>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}`,
  );
  out = out.replace(
    'onClick={() => onEdit(unit)}',
    'onClick={(e) => { e.stopPropagation(); onEdit(unit); }}',
  );
  return out;
});

log('UX files written to disk.');
