import { AlertTriangle, CheckCircle2, FileSignature, FileText, Wrench } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuickAdd } from '../../contexts/QuickAddContext';
import { useEntityDetail } from '../../contexts/EntityDetailContext';
import {
  formatShortDate,
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
          const to =
            action.href ??
            (action.tab ? `/broker/properties/${propertyId}?tab=${action.tab}` : `/broker/properties/${propertyId}`);
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
              <span className="shrink-0 text-sm font-semibold text-primary">פתח ←</span>
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
  snapshot,
}: {
  property: PropertyWithUnits;
  tenants: Tenant[];
  leases: Lease[];
  snapshot: WorkspaceSnapshot;
}) {
  const { openTenant } = useEntityDetail();
  const navigate = useNavigate();
  const current = tenants.filter((t) => t.status === 'active' || t.status === 'ending');
  const preview = current.slice(0, 6);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>סקירה כללית</CardTitle>
          <Link to={`/broker/units?property=${property.id}`} className="text-sm text-primary hover:underline">
            כל היחידות ←
          </Link>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-meta">תפוסה</dt>
              <dd className="text-value text-2xl">{snapshot.occupancyPercent}%</dd>
            </div>
            <div>
              <dt className="text-meta">יחידות תפוסות</dt>
              <dd className="text-value text-2xl">
                {property.occupiedUnits}/{property.totalUnits}
              </dd>
            </div>
            <div>
              <dt className="text-meta">שוכרים פעילים</dt>
              <dd className="text-lg font-semibold">{current.length}</dd>
            </div>
            <div>
              <dt className="text-meta">חוזים פעילים</dt>
              <dd className="text-lg font-semibold">{snapshot.activeLeases.length}</dd>
            </div>
            <div>
              <dt className="text-meta">שכ&quot;ד חודשי (סה&quot;כ)</dt>
              <dd className="text-lg font-semibold">{formatCurrency(snapshot.monthlyRent)}</dd>
            </div>
            <div>
              <dt className="text-meta">חוזים לטיפול (90 יום)</dt>
              <dd className="text-lg font-semibold">{snapshot.leasesNeedingRenewal.length}</dd>
            </div>
            <div>
              <dt className="text-meta">הסכמי חתימה</dt>
              <dd className="text-lg font-semibold">
                {snapshot.signedAgreements.length} חתומים · {snapshot.unsignedAgreements.length} ממתינים
              </dd>
            </div>
            <div>
              <dt className="text-meta">יחידות בתחזוקה</dt>
              <dd className="text-lg font-semibold">{snapshot.maintenanceUnits}</dd>
            </div>
          </dl>
          <p className="text-meta mt-4 border-t border-border/60 pt-4">
            {property.address}, {property.city}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>שוכרים פעילים</CardTitle>
          <Link to={`/broker/tenants?property=${property.id}`} className="text-sm text-primary hover:underline">
            כל השוכרים ←
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {preview.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="אין שוכרים פעילים"
              description="הוסיפו שוכר וחוזה כדי לנהל את הנכס."
              actionLabel="לשוכרים"
              onAction={() => navigate(`/broker/tenants?property=${property.id}`)}
              className="py-4"
            />
          ) : (
            preview.map((tenant) => (
              <button
                key={tenant.id}
                type="button"
                onClick={() => openTenant(tenant)}
                className="flex w-full items-start justify-between rounded-xl border border-border p-3 text-start transition-colors hover:border-primary/40 hover:bg-muted/20"
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
          {current.length > preview.length && (
            <p className="text-meta text-center">+{current.length - preview.length} שוכרים נוספים</p>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>תשלומים</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {snapshot.nextPayment ? (
            <>
              <div>
                <p className="text-value">{formatCurrency(snapshot.nextPayment.amount)}</p>
                <p className="text-meta">
                  {snapshot.nextPayment.tenant_name} · עד {formatShortDate(snapshot.nextPayment.due_date)}
                </p>
                <Badge
                  className="mt-2"
                  variant={snapshot.nextPayment.status === 'overdue' ? 'warning' : 'primary'}
                >
                  {snapshot.nextPayment.status === 'overdue' ? 'באיחור' : 'ממתין'}
                </Badge>
              </div>
              <Link to={`/broker/payments?property=${property.id}`} className="text-sm text-primary hover:underline">
                לכל התשלומים ←
              </Link>
            </>
          ) : (
            <>
              <EmptyState
                icon={CheckCircle2}
                title="אין תשלום ממתין"
                description="כשתיווצר חיוב — הוא יופיע כאן."
                className="py-4 sm:flex-1"
              />
              <Link to={`/broker/payments?property=${property.id}`} className="text-sm text-primary hover:underline">
                לכל התשלומים ←
              </Link>
            </>
          )}
          {snapshot.overduePayments.length > 0 && (
            <p className="text-sm text-warning sm:w-full">
              {snapshot.overduePayments.length} תשלומים באיחור —{' '}
              <Link to={`/broker/payments?property=${property.id}`} className="font-semibold underline">
                לטיפול
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
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
          title="אין הסכמי חתימה"
          description="צרו קישור חתימה דיגיטלי לשוכר או לקונה."
          actionLabel="הסכם חדש"
          onAction={() => openQuickAdd('agreement', { propertyId })}
        />
      ) : (
        links.map((link) => (
          <Card key={link.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <p className="font-medium">{link.client_name}</p>
                <p className="text-meta">{link.agreement_type}</p>
              </div>
              <Badge variant={link.status === 'signed' ? 'success' : 'outline'}>
                {SIGNING_STATUS_LABELS[link.status]}
              </Badge>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

export function ActivityPanel({ items }: { items: ActivityItem[] }) {
  return (
    <div className="space-y-4">
      <SectionHeading title="פעילות אחרונה" description="חוזים, תשלומים והסכמים — לפי תאריך." />
      {items.length === 0 ? (
        <EmptyState icon={FileText} title="אין פעילות" description="פעולות בנכס יופיעו כאן." />
      ) : (
        <ul className="space-y-2">
          {items.slice(0, 20).map((item) => (
            <li key={item.id} className="rounded-xl border border-border px-4 py-3">
              <p className="font-medium">{item.title}</p>
              {item.detail && <p className="text-meta">{item.detail}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function MaintenancePanel({ count, propertyId }: { count: number; propertyId: string }) {
  return (
    <div className="space-y-4">
      <SectionHeading
        title="תחזוקה"
        description="יחידות במצב תחזוקה בנכס."
        action={
          <Link to={`/broker/units?property=${propertyId}`}>
            <Button size="sm" variant="outline">
              <Wrench className="h-4 w-4" />
              יחידות
            </Button>
          </Link>
        }
      />
      {count === 0 ? (
        <EmptyState icon={Wrench} title="אין יחידות בתחזוקה" description="כל היחידות זמינות או תפוסות." />
      ) : (
        <Card>
          <CardContent className="py-6">
            <p className="text-value">{count}</p>
            <p className="text-meta">יחידות דורשות טיפול — עדכנו סטטוס ביחידות.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
