import { Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
import { notifyEntityCreated } from '../../contexts/QuickAddContext';
import { updateClient, updateLead, updateTask } from '../../lib/services';
import { formatCurrency } from '../../lib/utils';
import type { Client, Lead, LeadStatus, Task, TaskStatus } from '../../types/domain';
import {
  CLIENT_TYPE_LABELS,
  LEAD_STATUS_COLORS,
  LEAD_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
} from '../../types/domain';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { ClientFormModal, LeadFormModal, TaskFormModal } from './QuickAddModals';

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
  const [editOpen, setEditOpen] = useState(false);
  const [localView, setLocalView] = useState(view);

  useEffect(() => {
    setLocalView(view);
    setEditOpen(false);
  }, [view]);

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
            <DetailRow label="תאריך" value={formatDate(localView.data.created_at)} />
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
          initial={{
            full_name: localView.data.full_name,
            type: localView.data.type,
            phone: localView.data.phone,
            email: localView.data.email,
          }}
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
