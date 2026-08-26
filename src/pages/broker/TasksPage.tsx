import { Calendar } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CrmDetailModal, type CrmDetailView } from '../../components/broker/CrmDetailModal';
import { KanbanBoard } from '../../components/ui/KanbanBoard';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/PageLoader';
import { Badge } from '../../components/ui/Badge';
import { FilterBar } from '../../components/ui/FilterBar';
import { ViewToggle } from '../../components/ui/Tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { useAuth } from '../../contexts/AuthContext';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useEntityCreated } from '../../hooks/useEntityCreated';
import { fetchTasks } from '../../lib/services';
import type { Task, TaskStatus } from '../../types/domain';
import {
  TASK_PRIORITY_COLORS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
} from '../../types/domain';

const STATUSES: TaskStatus[] = ['open', 'in_progress', 'done'];

export function TasksPage() {
  const { user } = useAuth();
  const [view, setView] = useState<'table' | 'kanban'>('kanban');
  const [search, setSearch] = useState('');
  const [detailView, setDetailView] = useState<CrmDetailView | null>(null);
  const { data: tasks, loading, reload } = useAsyncData(() => fetchTasks(user?.id), [user?.id]);

  useEntityCreated('task', reload);

  const filtered = useMemo(
    () => tasks?.filter((t) => t.title.includes(search) || t.client_name?.includes(search)) ?? [],
    [tasks, search],
  );

  const kanbanColumns = STATUSES.map((status) => ({
    id: status,
    title: TASK_STATUS_LABELS[status],
    color: status === 'done' ? '#10b981' : status === 'in_progress' ? '#f59e0b' : '#3b82f6',
    items: filtered.filter((t) => t.status === status),
  }));

  if (loading || !tasks) return <PageLoader />;

  return (
    <div className="space-y-6">
      <PageHeader title="משימות" description="ניהול משימות ומעקב ביצוע" />

      <FilterBar search={search} onSearchChange={setSearch} placeholder="חיפוש משימה...">
        <ViewToggle view={view} onChange={setView} />
      </FilterBar>

      {view === 'kanban' ? (
        <KanbanBoard
          columns={kanbanColumns}
          onCardClick={(task) => setDetailView({ kind: 'task', data: task })}
          renderCard={(task: Task) => <TaskCard task={task} />}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>משימה</TableHead>
              <TableHead>לקוח</TableHead>
              <TableHead>נכס</TableHead>
              <TableHead>עדיפות</TableHead>
              <TableHead>סטטוס</TableHead>
              <TableHead>תאריך יעד</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((task) => (
              <TableRow
                key={task.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setDetailView({ kind: 'task', data: task })}
              >
                <TableCell className="font-medium">{task.title}</TableCell>
                <TableCell>{task.client_name ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{task.property_title ?? '—'}</TableCell>
                <TableCell>
                  <Badge style={{ backgroundColor: `${TASK_PRIORITY_COLORS[task.priority]}1f`, color: TASK_PRIORITY_COLORS[task.priority] }}>
                    {TASK_PRIORITY_LABELS[task.priority]}
                  </Badge>
                </TableCell>
                <TableCell>{TASK_STATUS_LABELS[task.status]}</TableCell>
                <TableCell>{task.due_date ? new Date(task.due_date).toLocaleDateString('he-IL') : '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <CrmDetailModal
        view={detailView}
        onClose={() => setDetailView(null)}
        onUpdated={reload}
      />
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  return (
    <div className="space-y-2">
      <p className="font-medium text-sm">{task.title}</p>
      {task.client_name && <p className="text-xs text-muted-foreground">{task.client_name}</p>}
      <div className="flex items-center justify-between">
        <Badge
          style={{
            backgroundColor: `${TASK_PRIORITY_COLORS[task.priority]}1f`,
            color: TASK_PRIORITY_COLORS[task.priority],
          }}
          className="text-[10px]"
        >
          {TASK_PRIORITY_LABELS[task.priority]}
        </Badge>
        {task.due_date && (
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {new Date(task.due_date).toLocaleDateString('he-IL')}
          </span>
        )}
      </div>
    </div>
  );
}
