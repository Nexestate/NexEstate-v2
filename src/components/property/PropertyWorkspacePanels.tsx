import { AlertTriangle, CheckCircle2, FileSignature, FileText, Wrench } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuickAdd } from '../../contexts/QuickAddContext';
import { useEntityDetail } from '../../contexts/EntityDetailContext';
import {
  formatShortDate,
  requirementsForTenantType,
  type ActivityItem,
  type WorkspaceAction,
  type WorkspaceSnapshot,
} from '../../lib/propertyWorkspace';
import { formatCurrency } from '../../lib/utils';
import type { Lease, PropertyWithUnits, SigningLink, Tenant } from '../../types/domain';
import { SIGNING_STATUS_LABELS, TENANT_STATUS_LABELS } from '../../types/domain';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { SectionHeading } from '../ui/SectionHeading';

export function AttentionList({
  actions,
  propertyId,
}: {
  actions: WorkspaceAction[];
  propertyId: string;
}) {
  const allClear = actions.length === 1 && actions[0]?.tone === 'success';

  return (
    <Card className={allClear ? 'border-success/35 bg-success/5' : 'border-warning/40 bg-warning/5'}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {allClear ? (
            <CheckCircle2 className="h-5 w-5 text-success" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-warning" />
          )}
          {allClear ? 'הנכס במצב תקין' : 'מה דורש טיפול בנכס'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action) => {
          if (action.tone === 'success') {
            return (
              <div key={action.id} className="rounded-2xl border border-success/35 bg-card/60 p-5">
                <p className="text-lg font-semibold">{action.title}</p>
                <p className="text-meta mt-0.5">{action.detail}</p>
              </div>
            );
          }
          const to = action.href ?? `/broker/properties/${propertyId}${action.tab ? `?tab=${action.tab}` : ''}`;
          return (
            <Link
              key={action.id}
              to={to}
              className="flex items-start justify-between gap-4 rounded-2xl border border-border/90 bg-card/80 p-5 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
            >
              <div>
                <p className="text-lg font-semibold">{action.title}</p>
                <p className="text-meta mt-0.5">{action.detail}</p>
              </div>
              <span className="shrink-0 text-sm text-primary">פתח ←</span>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function OverviewFacts({
  property,
  tenants,
  leases,
  snapshot,
}: {
  property: PropertyWithUnits;
  tenants: Tenant[];
  leases: Lease[];
  snapshot: WorkspaceSnapshot;
}) {
  const { openTenant } = useEntityDetail();
  const current = tenants.filter((t) => t.status === 'active' || t.status === 'ending');
  const activeLease = leases.find((l) => l.is_active);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>שוכר וחוזה פעיל</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {current.length === 0 ? (
            <p className="text-meta">אין שוכר פעיל — הנכס או היחידות פנויים.</p>
          ) : (
            current.map((tenant) => (
              <button
                key={tenant.id}
                type="button"
                onClick={() => openTenant(tenant)}
                className="flex w-full items-start justify-between rounded-xl border border-border p-3 text-start hover:border-primary/40"
              >
                <div>
                  <p className="font-medium">{tenant.full_name}</p>
                  <p className="text-meta">
                    {tenant.tenant_type === 'company' ? tenant.company_name ?? 'חברה' : 'שוכר פרטי'}
                    {tenant.unit_number ? ` · יח׳ ${tenant.unit_number}` : ''}
                  </p>
                </div>
                <Badge variant={tenant.status === 'active' ? 'success' : 'warning'}>
                  {TENANT_STATUS_LABELS[tenant.status]}
                </Badge>
              </button>
            ))
          )}
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-meta">תפוסה</dt>
              <dd className="font-semibold">{snapshot.occupied ? `${snapshot.occupancyPercent}%` : 'פנוי'}</dd>
            </div>
            <div>
              <dt className="text-meta">שכירות חודשית</dt>
              <dd className="font-semibold">{formatCurrency(snapshot.monthlyRent)}</dd>
            </div>
            <div>
              <dt className="text-meta">סיום חוזה</dt>
              <dd className="font-semibold">
                {snapshot.nextLeaseEnd ? formatShortDate(snapshot.nextLeaseEnd.end_date) : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-meta">הסכם חתום</dt>
              <dd className="font-semibold">{snapshot.signedAgreements.length > 0 ? 'כן' : 'לא'}</dd>
            </div>
          </dl>
          {activeLease && (
            <p className="text-meta">
              חוזה {activeLease.tenant_name} · {formatShortDate(activeLease.start_date)}–{formatShortDate(activeLease.end_date)}
            </p>
          )}
          <p className="text-meta">
            יחידות {property.occupiedUnits}/{property.totalUnits} · {property.address}, {property.city}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>התשלום הבא</CardTitle>
        </CardHeader>
        <CardContent>
          {snapshot.nextPayment ? (
            <div className="space-y-2">
              <p className="text-value">{formatCurrency(snapshot.nextPayment.amount)}</p>
              <p className="text-meta">
                {snapshot.nextPayment.tenant_name} · עד {formatShortDate(snapshot.nextPayment.due_date)}
              </p>
              <Badge variant={snapshot.nextPayment.status === 'overdue' ? 'warning' : 'primary'}>
                {snapshot.nextPayment.status === 'overdue' ? 'באיחור' : 'ממתין'}
              </Badge>
              <div>
                <Link to={`/broker/payments?property=${property.id}`} className="text-sm text-primary hover:underline">
                  לכל התשלומים ←
                </Link>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={CheckCircle2}
              title="אין תשלום ממתין"
              description="כשתיווצר חיוב או דרישת תשלום — היא תופיע כאן."
              className="py-6"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function DocumentsPanel({ tenants, propertyId }: { tenants: Tenant[]; propertyId: string }) {
  const navigate = useNavigate();
  const active = tenants.filter((t) => t.status !== 'ended');

  return (
    <div className="space-y-4">
      <SectionHeading
        title="כספת מסמכים"
        description="רשימת החובה לפי סוג שוכר. העלאה פרטית תחובר בשלב הכספת — בלי קישורים ציבוריים."
      />
      {active.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="אין שוכר לתיק מסמכים"
          description="הוסיפו שוכר לנכס כדי לראות אילו מסמכים חסרים."
          actionLabel="לשוכרים"
          onAction={() => navigate(`/broker/tenants?property=${propertyId}`)}
        />
      ) : (
        active.map((tenant) => {
          const required = requirementsForTenantType(tenant.tenant_type);
          return (
            <Card key={tenant.id}>
              <CardHeader>
                <CardTitle>
                  {tenant.full_name}
                  <span className="text-meta ms-2 font-normal">
                    0/{required.length} מסמכי חובה הושלמו
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {required.map((req) => (
                  <div key={req.id} className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
                    <span>{req.label}</span>
                    <Badge variant="outline">חסר</Badge>
                  </div>
                ))}
                <p className="text-meta">
                  הקבצים יישמרו בבאקט פרטי עם כתובת חתומה קצרת־חיים. לא נשתמש ב־TEXT[] ולא ב־URL ציבורי.
                </p>
                <Link to={`/broker/tenants?property=${propertyId}`} className="text-sm text-primary hover:underline">
                  פתיחת כרטיס שוכר ←
                </Link>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}

export function AgreementsPanel({ links, propertyId }: { links: SigningLink[]; propertyId: string }) {
  const { openQuickAdd } = useQuickAdd();

  return (
    <div className="space-y-4">
      <SectionHeading
        title="הסכמים וחתימה"
        description="מבוסס על קישורי החתימה הקיימים. שליחת מייל ומחזור חיים מורחב יגיעו בשלב 2D."
        action={
          <Button size="sm" onClick={() => openQuickAdd('agreement', { propertyId })}>
            הסכם חדש
          </Button>
        }
      />
      {links.length === 0 ? (
        <EmptyState
          icon={FileSignature}
          title="אין הסכם לנכס"
          description="צרו קישור חתימה מאובטח לשוכר — הסטטוס יופיע כאן."
          actionLabel="צור הסכם"
          onAction={() => openQuickAdd('agreement', { propertyId })}
        />
      ) : (
        <div className="space-y-2">
          {links.map((link) => (
            <div key={link.id} className="flex items-center justify-between rounded-xl border border-border p-4">
              <div>
                <p className="font-medium">{link.client_name}</p>
                <p className="text-meta">{link.client_email || link.client_phone || '—'}</p>
              </div>
              <Badge variant={link.status === 'signed' ? 'success' : 'warning'}>
                {SIGNING_STATUS_LABELS[link.status]}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ActivityPanel({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="אין פעילות עדיין"
        description="חוזים, תשלומים וחתימות בנכס יופיעו כאן כציר זמן."
      />
    );
  }

  return (
    <div className="space-y-3">
      <SectionHeading title="פעילות הנכס" description="אירועים אמיתיים מחוזים, תשלומים והסכמים." />
      {items.map((item) => (
        <div key={item.id} className="rounded-xl border border-border p-4">
          <p className="font-medium">{item.title}</p>
          {item.detail && <p className="text-meta mt-0.5">{item.detail}</p>}
          <p className="text-meta mt-1">{formatShortDate(item.at)}</p>
        </div>
      ))}
    </div>
  );
}

export function MaintenancePanel({ count, propertyId }: { count: number; propertyId: string }) {
  return (
    <div className="space-y-4">
      <SectionHeading title="תחזוקה" description="יחידות בסטטוס תחזוקה. קריאות שירות מלאות יתווספו בהמשך." />
      {count === 0 ? (
        <EmptyState
          icon={Wrench}
          title="אין תקלות פתוחות"
          description="כשיחידה תסומן בתחזוקה או תיפתח משימת טיפול — היא תופיע כאן."
        />
      ) : (
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="font-medium">{count} יחידות בתחזוקה</p>
              <p className="text-meta">עברו לרשימת היחידות כדי לעדכן סטטוס</p>
            </div>
            <Link to={`/broker/units?property=${propertyId}`}>
              <Button variant="outline">ליחידות</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
