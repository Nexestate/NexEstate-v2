import { Phone, User } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { FilterBar } from '../../components/ui/FilterBar';
import { KanbanBoard } from '../../components/ui/KanbanBoard';
import { Tabs, ViewToggle } from '../../components/ui/Tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { useAuth } from '../../contexts/AuthContext';
import { fetchClients, fetchLeads } from '../../lib/services';
import { formatCurrency } from '../../lib/utils';
import type { Client, Lead, LeadStatus } from '../../types/domain';
import {
  CLIENT_TYPE_LABELS,
  LEAD_STATUS_COLORS,
  LEAD_STATUS_LABELS,
} from '../../types/domain';

const LEAD_STATUSES: LeadStatus[] = ['new', 'contacted', 'qualified', 'won', 'lost'];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('he-IL');
}

export function LeadsPage() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [section, setSection] = useState<'leads' | 'clients'>(
    pathname.includes('/clients') ? 'clients' : 'leads',
  );
  const [view, setView] = useState<'table' | 'kanban'>('table');
  const [search, setSearch] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchLeads(user?.id), fetchClients(user?.id)]).then(([l, c]) => {
      setLeads(l);
      setClients(c);
      setLoading(false);
    });
  }, [user?.id]);

  const filteredLeads = useMemo(
    () =>
      leads.filter(
        (l) =>
          l.full_name.includes(search) ||
          l.phone.includes(search) ||
          (l.property_title?.includes(search) ?? false),
      ),
    [leads, search],
  );

  const filteredClients = useMemo(
    () =>
      clients.filter(
        (c) =>
          c.full_name.includes(search) ||
          (c.email?.includes(search) ?? false) ||
          (c.phone?.includes(search) ?? false),
      ),
    [clients, search],
  );

  const kanbanColumns = LEAD_STATUSES.map((status) => ({
    id: status,
    title: LEAD_STATUS_LABELS[status],
    color: LEAD_STATUS_COLORS[status],
    items: filteredLeads.filter((l) => l.status === status),
  }));

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">לידים ולקוחות</h2>
        <p className="text-sm text-muted-foreground">ניהול CRM — מעקב לידים ולקוחות</p>
      </div>

      <Tabs
        tabs={[
          { id: 'leads', label: 'לידים', count: leads.length },
          { id: 'clients', label: 'לקוחות', count: clients.length },
        ]}
        active={section}
        onChange={(id) => setSection(id as 'leads' | 'clients')}
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder={section === 'leads' ? 'חיפוש ליד...' : 'חיפוש לקוח...'}
      >
        {section === 'leads' && <ViewToggle view={view} onChange={setView} />}
      </FilterBar>

      {section === 'leads' && view === 'kanban' && (
        <KanbanBoard
          columns={kanbanColumns}
          renderCard={(lead: Lead) => (
            <div className="space-y-2">
              <p className="font-medium">{lead.full_name}</p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" />
                {lead.phone}
              </p>
              {lead.property_title && (
                <p className="text-xs text-primary">{lead.property_title}</p>
              )}
              {lead.source && (
                <Badge variant="outline" className="text-[10px]">{lead.source}</Badge>
              )}
            </div>
          )}
        />
      )}

      {section === 'leads' && view === 'table' && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>שם</TableHead>
              <TableHead>טלפון</TableHead>
              <TableHead>נכס</TableHead>
              <TableHead>מקור</TableHead>
              <TableHead>סטטוס</TableHead>
              <TableHead>תאריך</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className="font-medium">{lead.full_name}</TableCell>
                <TableCell>{lead.phone}</TableCell>
                <TableCell className="text-muted-foreground">
                  {lead.property_title ?? '—'}
                </TableCell>
                <TableCell>{lead.source ?? '—'}</TableCell>
                <TableCell>
                  <Badge
                    style={{
                      backgroundColor: `${LEAD_STATUS_COLORS[lead.status]}1f`,
                      color: LEAD_STATUS_COLORS[lead.status],
                    }}
                  >
                    {LEAD_STATUS_LABELS[lead.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(lead.created_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {section === 'clients' && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>שם</TableHead>
              <TableHead>סוג</TableHead>
              <TableHead>טלפון</TableHead>
              <TableHead>אימייל</TableHead>
              <TableHead>תקציב</TableHead>
              <TableHead>ערים</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map((client) => (
              <TableRow key={client.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{client.full_name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="primary">{CLIENT_TYPE_LABELS[client.type]}</Badge>
                </TableCell>
                <TableCell>{client.phone ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{client.email ?? '—'}</TableCell>
                <TableCell>
                  {client.budget_min && client.budget_max
                    ? `${formatCurrency(client.budget_min)} – ${formatCurrency(client.budget_max)}`
                    : '—'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {client.preferred_cities?.join(', ') ?? '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
