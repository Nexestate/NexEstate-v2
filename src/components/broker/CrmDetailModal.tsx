import { Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
import { notifyEntityCreated } from '../../contexts/QuickAddContext';
import { useAuth } from '../../contexts/AuthContext';
import { findMatchesForClient, findMatchesForLead, fetchProperties, updateClient, updateLead, updateTask } from '../../lib/services';
import type { LeadMatchResult } from '../../lib/services';
import { formatCurrency } from '../../lib/utils';
import { PROPERTY_KIND_LABELS } from '../../lib/constants';
import type { Client, Lead, LeadStatus, PropertyKind, Task, TaskStatus } from '../../types/domain';
import {
  CLIENT_TYPE_LABELS,
  LEAD_STATUS_COLORS,
  LEAD_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
} from '../../types/domain';
import type { ScoredMatch, MatchProperty } from '../../lib/matching';
import { isDemandClientType } from './ClientFormModal';
import { PropertyMatchList, MatchBadge } from './MatchResultsList';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { ClientFormModal } from './ClientFormModal';
import { LeadFormModal, TaskFormModal } from './QuickAddModals';

export type CrmDetailView =
  | { kind: 'lead'; data: Lead }
  | { kind: 'client'; data: Client }
  | { kind: 'task'; data: Task };

interface CrmDetailModalProps {
  view: CrmDetailView | null;
  onClose: () => void;
  onUpdated: () => void;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-2.5 last:border-0">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="text-end text-sm font-medium">{value ?? '—'}</span>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('he-IL');
}

const SELECT_CLASS =
  'rounded-xl border border-border bg-muted/50 px-3 py-1.5 text-sm';

export function CrmDetailModal({ view, onClose, onUpdated }: CrmDetailModalProps) {
  const { user } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [localView, setLocalView] = useState(view);
  const [clientMatches, setClientMatches] = useState<ScoredMatch<MatchProperty>[]>([]);
  const [leadMatches, setLeadMatches] = useState<LeadMatchResult | null>(null);
  const [clientMatchesLoading, setClientMatchesLoading] = useState(false);
  const [leadMatchesLoading, setLeadMatchesLoading] = useState(false);
  const [clientProperties, setClientProperties] = useState<Array<{ id: string; title: string }>>([]);

  useEffect(() => {
    setLocalView(view);
    setEditOpen(false);
  }, [view]);

  useEffect(() => {
    if (localView?.kind !== 'client' || !user?.id) {
      setClientMatches([]);
      return;
    }
    if (!isDemandClientType(localView.data.type)) {
      setClientMatches([]);
      return;
    }
    setClientMatchesLoading(true);
    void findMatchesForClient(localView.data, user.id).then((rows) => {
      setClientMatches(rows);
      setClientMatchesLoading(false);
    });
  }, [localView, user?.id]);

  useEffect(() => {
    if (localView?.kind !== 'lead' || !user?.id) {
      setLeadMatches(null);
      return;
    }
    setLeadMatchesLoading(true);
    void findMatchesForLead(localView.data, user.id).then((result) => {
      setLeadMatches(result);
      setLeadMatchesLoading(false);
    });
  }, [localView, user?.id]);

  useEffect(() => {
    if (!editOpen || localView?.kind !== 'client' || !user?.id) return;
    void fetchProperties(user.id).then((rows) =>
      setClientProperties(rows.map((p) => ({ id: p.id, title: p.title }))),
    );
  }, [editOpen, localView, user?.id]);

  if (!localView) return null;

  const titles = {
    lead: 'פרטי ליד',
    client: 'פרטי לקוח',
    task: 'פרטי משימה',
  };

  const refreshLocal = (next: CrmDetailView) => {
    setLocalView(next);
    onUpdated();
  };

  const handleLeadStatusChange = async (status: LeadStatus) => {
    if (localView?.kind !== 'lead') return;
    const lead = localView.data;
    await updateLead(lead.id, { status });
    notifyEntityCreated('lead');
    refreshLocal({ kind: 'lead', data: { ...lead, status } });
  };

  const handleTaskStatusChange = async (status: TaskStatus) => {
    if (localView?.kind !== 'task') return;
    const task = localView.data;
    await updateTask(task.id, { status });
    notifyEntityCreated('task');
    refreshLocal({ kind: 'task', data: { ...task, status } });
  };

  return (
    <>
      <Modal open={Boolean(view)} onClose={onClose} title={titles[localView.kind]} size="lg">
        {localView.kind === 'lead' && (
          <div className="space-y-4">
            <DetailRow label="שם" value={localView.data.full_name} />
            <DetailRow
              label="טלפון"
              value={
                <a href={`tel:${localView.data.phone}`} className="text-primary hover:underline">
                  {localView.data.phone}
                </a>
              }
            />
            <DetailRow label="נכס" value={localView.data.property_title} />
            <DetailRow label="מקור" value={localView.data.source} />
            {localView.data.interest && (
              <DetailRow label="עניין / הערות" value={localView.data.interest} />
            )}
            {localView.data.email && (
              <DetailRow
                label="אימייל"
                value={
                  <a href={`mailto:${localView.data.email}`} className="text-primary hover:underline">
                    {localView.data.email}
                  </a>
                }
              />
            )}
            <DetailRow
              label="סטטוס"
              value={
                <select
                  className={SELECT_CLASS}
                  value={localView.data.status}
                  onChange={(e) => void handleLeadStatusChange(e.target.value as LeadStatus)}
                >
                  {Object.entries(LEAD_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              }
            />
            <DetailRow label="תאריך" value={formatDate(localView.data.created_at)} />

            {localView.data.property_id && (
              <div className="space-y-3 rounded-xl border border-border p-4">
                <p className="text-sm font-medium">נכסים מתאימים</p>
                {leadMatchesLoading ? (
                  <p className="text-sm text-muted-foreground">טוען התאמות...</p>
                ) : (
                  <>
                    {leadMatches?.sourceProperty && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">נכס מקור (דף נחיתה)</p>
                        <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 p-3">
                          <div>
                            <p className="text-sm font-medium">{leadMatches.sourceProperty.item.title}</p>
                            <p className="text-xs text-muted-foreground">{leadMatches.sourceProperty.item.city}</p>
                          </div>
                          <MatchBadge level="perfect" />
                        </div>
                      </div>
                    )}
                    {leadMatches && leadMatches.additionalMatches.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          נכסים נוספים מתאימים ({leadMatches.additionalMatches.length})
                        </p>
                        <PropertyMatchList matches={leadMatches.additionalMatches} emptyMessage="" />
                      </div>
                    ) : (
                      !leadMatchesLoading &&
                      leadMatches?.sourceProperty && (
                        <p className="text-sm text-muted-foreground">לא נמצאו נכסים נוספים מתאימים</p>
                      )
                    )}
                  </>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              <Badge
                style={{
                  backgroundColor: `${LEAD_STATUS_COLORS[localView.data.status]}1f`,
                  color: LEAD_STATUS_COLORS[localView.data.status],
                }}
              >
                {LEAD_STATUS_LABELS[localView.data.status]}
              </Badge>
              <Button type="button" size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4" />
                עריכה
              </Button>
            </div>
          </div>
        )}

        {localView.kind === 'client' && (
          <div className="space-y-4">
            <DetailRow label="שם" value={localView.data.full_name} />
            <DetailRow label="סוג" value={CLIENT_TYPE_LABELS[localView.data.type]} />
            <DetailRow
              label="טלפון"
              value={
                localView.data.phone ? (
                  <a href={`tel:${localView.data.phone}`} className="text-primary hover:underline">
                    {localView.data.phone}
                  </a>
                ) : (
                  '—'
                )
              }
            />
            <DetailRow
              label="אימייל"
              value={
                localView.data.email ? (
                  <a href={`mailto:${localView.data.email}`} className="text-primary hover:underline">
                    {localView.data.email}
                  </a>
                ) : (
                  '—'
                )
              }
            />
            <DetailRow
              label="תקציב"
              value={
                localView.data.budget_min && localView.data.budget_max
                  ? `${formatCurrency(localView.data.budget_min)} – ${formatCurrency(localView.data.budget_max)}`
                  : '—'
              }
            />
            <DetailRow label="ערים" value={localView.data.preferred_cities?.join(', ')} />
            <DetailRow
              label="סוגי נכס"
              value={
                localView.data.preferred_kinds?.length
                  ? localView.data.preferred_kinds
                      .map((k) => PROPERTY_KIND_LABELS[k as PropertyKind] ?? k)
                      .join(', ')
                  : '—'
              }
            />
            <DetailRow label="חדרים מינ." value={localView.data.min_rooms ?? '—'} />
            <DetailRow label={'שטח מינ. (מ"ר)'} value={localView.data.min_area ?? '—'} />
            <DetailRow label="מקור" value={localView.data.source} />
            <DetailRow label="הערות" value={localView.data.notes} />
            <DetailRow label="תאריך" value={formatDate(localView.data.created_at)} />

            {isDemandClientType(localView.data.type) && (
              <div className="rounded-xl border border-border p-4">
                <p className="mb-3 text-sm font-medium">נכסים מתאימים</p>
                {clientMatchesLoading ? (
                  <p className="text-sm text-muted-foreground">טוען התאמות...</p>
                ) : (
                  <PropertyMatchList matches={clientMatches} />
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4" />
                עריכה
              </Button>
            </div>
          </div>
        )}

        {localView.kind === 'task' && (
          <div className="space-y-4">
            <DetailRow label="כותרת" value={localView.data.title} />
            <DetailRow label="לקוח" value={localView.data.client_name} />
            <DetailRow label="נכס" value={localView.data.property_title} />
            <DetailRow label="עדיפות" value={TASK_PRIORITY_LABELS[localView.data.priority]} />
            <DetailRow
              label="סטטוס"
              value={
                <select
                  className={SELECT_CLASS}
                  value={localView.data.status}
                  onChange={(e) => void handleTaskStatusChange(e.target.value as TaskStatus)}
                >
                  {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              }
            />
            <DetailRow
              label="תאריך יעד"
              value={localView.data.due_date ? formatDate(localView.data.due_date) : '—'}
            />
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant="outline">{TASK_STATUS_LABELS[localView.data.status]}</Badge>
              <Button type="button" size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4" />
                עריכה
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {localView.kind === 'lead' && (
        <LeadFormModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          title="עריכת ליד"
          initial={{
            full_name: localView.data.full_name,
            phone: localView.data.phone,
            source: localView.data.source,
            status: localView.data.status,
          }}
          onSubmit={async (values) => {
            await updateLead(localView.data.id, {
              full_name: values.full_name,
              phone: values.phone,
              source: values.source,
              status: values.status,
            });
            notifyEntityCreated('lead');
            setEditOpen(false);
            refreshLocal({
              kind: 'lead',
              data: {
                ...localView.data,
                full_name: values.full_name,
                phone: values.phone,
                source: values.source,
                status: values.status ?? localView.data.status,
              },
            });
          }}
        />
      )}

      {localView.kind === 'client' && (
        <ClientFormModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          title="עריכת לקוח"
          properties={clientProperties}
          initial={localView.data}
          onSubmit={async (values) => {
            await updateClient(localView.data.id, values);
            notifyEntityCreated('client');
            setEditOpen(false);
            refreshLocal({
              kind: 'client',
              data: { ...localView.data, ...values },
            });
          }}
        />
      )}

      {localView.kind === 'task' && (
        <TaskFormModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          title="עריכת משימה"
          initial={{
            title: localView.data.title,
            priority: localView.data.priority,
            due_date: localView.data.due_date,
            status: localView.data.status,
          }}
          onSubmit={async (values) => {
            await updateTask(localView.data.id, {
              title: values.title,
              priority: values.priority,
              due_date: values.due_date,
              status: values.status,
            });
            notifyEntityCreated('task');
            setEditOpen(false);
            refreshLocal({
              kind: 'task',
              data: {
                ...localView.data,
                title: values.title,
                priority: values.priority,
                due_date: values.due_date,
                status: values.status ?? localView.data.status,
              },
            });
          }}
        />
      )}
    </>
  );
}
