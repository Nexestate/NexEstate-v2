const fs = require('fs');
const path = require('path');
const root = 'C:/Users/office/Projects/NexEstate-v2';
function load(rel){return fs.readFileSync(path.join(root,rel),'utf8');}
function save(rel,s){fs.writeFileSync(path.join(root,rel),s); console.log('saved',rel);}
function ensure(src, stmt){
  if (src.includes(stmt)) return src;
  const lines = src.split(/\r?\n/);
  let i=0; for (let n=0;n<lines.length;n++) if (lines[n].startsWith('import ')) i=n;
  lines.splice(i+1,0,stmt); return lines.join('\n');
}

let u = load('src/pages/broker/UnitsPage.tsx');
u = ensure(u, "import { EntityLinkButton } from '../../components/broker/EntityLinkButton';");
u = ensure(u, "import { BackButton } from '../../components/ui/BackButton';");
u = ensure(u, "import { useEntityDetail } from '../../contexts/EntityDetailContext';");
if (!u.includes('openTenantById')) {
  u = u.replace('  const { openQuickAdd } = useQuickAdd();\n', "  const { openQuickAdd } = useQuickAdd();\n  const { openUnit, openUnitById, openTenantById, openLeaseById } = useEntityDetail();\n");
}
u = u.replace(/to=\{`\/broker\/tenants\?property=\$\{unit\.property_id\}&open=\$\{unit\.tenant_id\}`\}/g, '__ENTITY_TENANT__');
u = u.replace(/to=\{`\/broker\/leases\?property=\$\{unit\.property_id\}&open=\$\{unit\.lease_id\}`\}/g, '__ENTITY_LEASE__');
if (u.includes('__ENTITY_TENANT__')) {
  u = u.replace(/<Link\s+__ENTITY_TENANT__\s+className="text-primary hover:underline"\s*>\s*\{unit\.tenant_name\}\s*<\/Link>/g,
    '<EntityLinkButton onClick={() => void openTenantById(unit.tenant_id!)}>{unit.tenant_name}</EntityLinkButton>');
  u = u.replace(/<Link\s+__ENTITY_LEASE__\s+className="text-primary hover:underline"\s*>\s*צפייה\s*<\/Link>/g,
    '<EntityLinkButton onClick={() => void openLeaseById(unit.lease_id!)}>צפייה</EntityLinkButton>');
}
if (!u.includes('<BackButton') && u.includes('space-y-6')) {
  u = u.replace('<div className="space-y-6">', '<div className="space-y-6">\n      {propertyFilter && <BackButton to="/broker/units" label="חזרה לכל היחידות" />}');
}
if (!u.includes('onClick={() => openUnit') && u.includes('key={unit.id}')) {
  u = u.replace(/<TableRow\s+key=\{unit\.id\}([^>]*)>/, '<TableRow key={unit.id}$1 className="cursor-pointer" onClick={() => openUnit({ ...unit, propertyTitle: unit.propertyTitle, property_id: unit.property_id })}>');
}
save('src/pages/broker/UnitsPage.tsx', u);

let l = load('src/pages/broker/LeasesPage.tsx');
l = ensure(l, "import { EntityLinkButton } from '../../components/broker/EntityLinkButton';");
l = ensure(l, "import { BackButton } from '../../components/ui/BackButton';");
l = ensure(l, "import { useEntityDetail } from '../../contexts/EntityDetailContext';");
if (!l.includes('openTenantById')) {
  l = l.replace('  const { user } = useAuth();\n', "  const { user } = useAuth();\n  const { openLease, openTenant, openLeaseById, openTenantById, openUnitById } = useEntityDetail();\n");
}
if (!l.includes('openTenant(tenant)')) {
  l = l.replace('  const propertyTitle = propertyFilter', `  useEffect(() => {
    if (!openId || loading) return;
    const tenant = tenants.find((t) => t.id === openId);
    if (tenant) { openTenant(tenant); return; }
    const lease = leases.find((x) => x.id === openId);
    if (lease) { openLease(lease); return; }
    void openTenantById(openId);
  }, [openId, loading, leases, tenants, openLease, openTenant, openTenantById]);

  const propertyTitle = propertyFilter`);
}
if (!l.includes('<BackButton')) {
  l = l.replace('<div className="space-y-6">', '<div className="space-y-6">\n      {propertyFilter && <BackButton to={section === \'tenants\' ? \'/broker/tenants\' : \'/broker/leases\'} label="חזרה לרשימה המלאה" />}');
}
l = l.replace(/to=\{`\/broker\/tenants\?property=\$\{lease\.property_id\}&open=\$\{lease\.tenant_id\}`\}/g, 'data-entity="tenant"');
l = l.replace(/<Link\s+data-entity="tenant"\s+className="text-primary hover:underline"\s*>\s*\{lease\.tenant_name\}\s*<\/Link>/,
  '<EntityLinkButton onClick={() => void openTenantById(lease.tenant_id)}>{lease.tenant_name}</EntityLinkButton>');
l = l.replace(/to=\{`\/broker\/leases\?property=\$\{tenant\.property_id\}&open=\$\{tenant\.lease_id\}`\}/g, 'data-entity="lease"');
l = l.replace(/<Link\s+data-entity="lease"\s+className="text-primary hover:underline"\s*>\s*צפייה\s*<\/Link>/,
  '<EntityLinkButton onClick={() => void openLeaseById(tenant.lease_id!)}>צפייה</EntityLinkButton>');
if (!l.includes('onClick={() => openLease(lease)}')) {
  l = l.replace(/<TableRow\s+key=\{lease\.id\}([^>]*)>/, '<TableRow key={lease.id}$1 className="cursor-pointer" onClick={() => openLease(lease)}>');
  l = l.replace(/<TableRow\s+key=\{tenant\.id\}([^>]*)>/, '<TableRow key={tenant.id}$1 className="cursor-pointer" onClick={() => openTenant(tenant)}>');
}
save('src/pages/broker/LeasesPage.tsx', l);

let p = load('src/pages/broker/PaymentsPage.tsx');
p = ensure(p, "import { BackButton } from '../../components/ui/BackButton';");
p = ensure(p, "import { EntityLinkButton } from '../../components/broker/EntityLinkButton';");
p = ensure(p, "import { useEntityDetail } from '../../contexts/EntityDetailContext';");
if (!p.includes('openTenantById')) {
  p = p.replace("  const [searchParams] = useSearchParams();\n", "  const [searchParams] = useSearchParams();\n  const { openPayment, openPaymentById, openTenantById, openUnitById, openLeaseById } = useEntityDetail();\n");
}
if (!p.includes('<BackButton')) {
  p = p.replace('<div className="space-y-6">', '<div className="space-y-6">\n      {propertyFilter && <BackButton to="/broker/payments" label="חזרה לכל התשלומים" />}');
}
p = p.replace(/<TableRow key=\{p\.id\}>/, '<TableRow key={p.id} className="cursor-pointer" onClick={() => openPayment(p)}>');
p = p.replace(/to=\{`\/broker\/tenants\?property=\$\{p\.property_id\}&open=\$\{p\.tenant_id\}`\}/g, 'data-entity="tenant"');
p = p.replace(/<Link\s+data-entity="tenant"\s+className="text-primary hover:underline"\s*>\s*\{p\.tenant_name\}\s*<\/Link>/,
  '<EntityLinkButton onClick={() => void openTenantById(p.tenant_id!)}>{p.tenant_name}</EntityLinkButton>');
p = p.replace(/to=\{`\/broker\/leases\?property=\$\{p\.property_id\}&open=\$\{p\.lease_id\}`\}/g, 'data-entity="lease"');
p = p.replace(/<Link\s+data-entity="lease"\s+className="text-primary hover:underline"\s*>\s*צפייה\s*<\/Link>/,
  '<EntityLinkButton onClick={() => void openLeaseById(p.lease_id!)}>צפייה</EntityLinkButton>');
save('src/pages/broker/PaymentsPage.tsx', p);

let m = load('src/components/broker/ManagedUnitsTable.tsx');
m = ensure(m, "import { EntityLinkButton } from './EntityLinkButton';");
m = ensure(m, "import { useEntityDetail } from '../../contexts/EntityDetailContext';");
if (!m.includes('openTenantById')) {
  m = m.replace('}: ManagedUnitsTableProps) {\n  return (', '}: ManagedUnitsTableProps) {\n  const { openUnit, openTenantById, openLeaseById } = useEntityDetail();\n  return (');
}
m = m.replace(/to=\{`\/broker\/tenants\?property=\$\{propertyId\}&open=\$\{unit\.tenant_id\}`\}/g, 'data-entity="tenant"');
m = m.replace(/<Link\s+data-entity="tenant"\s+className="text-primary hover:underline"\s*>\s*\{unit\.tenant_name\}\s*<\/Link>/,
  '<EntityLinkButton onClick={() => void openTenantById(unit.tenant_id!)}>{unit.tenant_name}</EntityLinkButton>');
m = m.replace(/to=\{`\/broker\/leases\?property=\$\{propertyId\}&open=\$\{unit\.lease_id\}`\}/g, 'data-entity="lease"');
m = m.replace(/<Link\s+data-entity="lease"\s+className="text-primary hover:underline"\s*>\s*צפייה\s*<\/Link>/,
  '<EntityLinkButton onClick={() => void openLeaseById(unit.lease_id!)}>צפייה</EntityLinkButton>');
save('src/components/broker/ManagedUnitsTable.tsx', m);

let nav = load('src/components/mobile/MobileBottomNav.tsx');
nav = nav.replace(/\n  const \[visible, setVisible\] = useState\(true\);\n  const lastScrollY = useRef\(0\);\n/, '\n');
nav = nav.replace("import { useEffect, useRef, useState } from 'react';", "import { useEffect, useState } from 'react';");
nav = nav.replace(/\n  useEffect\(\(\) => \{\n    const scrollRoot = document\.querySelector\('main'\);[\s\S]*?\n  \}, \[location\.pathname\]\);\n/, '\n');
nav = nav.replace(/visible \? 'translate-y-0' : 'translate-y-full',?\n/, '');
save('src/components/mobile/MobileBottomNav.tsx', nav);
console.log('patch done');