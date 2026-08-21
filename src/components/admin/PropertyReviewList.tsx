import { Building2, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { FilterBar } from '../../components/ui/FilterBar';
import { PageHeader } from '../../components/ui/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { DEMO_PROPERTY_REVIEWS } from '../../data/demoData';
import type { ReviewStatus } from '../../data/demoData.admin';
import { useMemo, useState } from 'react';

interface PropertyReviewListProps {
  status: ReviewStatus;
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  showActions?: boolean;
}

export function PropertyReviewList({
  status,
  title,
  description,
  emptyTitle,
  emptyDescription,
  showActions = false,
}: PropertyReviewListProps) {
  const [search, setSearch] = useState('');
  const [items, setItems] = useState(DEMO_PROPERTY_REVIEWS.filter((r) => r.status === status));

  const filtered = useMemo(
    () =>
      items.filter(
        (r) =>
          r.title.includes(search) ||
          r.city.includes(search) ||
          r.broker_name.includes(search),
      ),
    [items, search],
  );

  const handleApprove = (id: string) => {
    setItems((prev) => prev.filter((r) => r.id !== id));
  };

  const handleReject = (id: string) => {
    setItems((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />

      <FilterBar search={search} onSearchChange={setSearch} placeholder="חיפוש נכס..." />

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border py-16 text-center">
          <Building2 className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">{emptyTitle}</p>
          <p className="text-sm text-muted-foreground">{emptyDescription}</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>נכס</TableHead>
              <TableHead>מתווך</TableHead>
              <TableHead>סוג</TableHead>
              <TableHead>{status === 'pending' ? 'הוגש' : status === 'approved' ? 'אושר' : 'נדחה'}</TableHead>
              {status === 'rejected' && <TableHead>סיבת דחייה</TableHead>}
              {showActions && <TableHead>פעולות</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((review) => (
              <TableRow key={review.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{review.title}</p>
                    <p className="text-xs text-muted-foreground">{review.city} · {review.address}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p>{review.broker_name}</p>
                    <p className="text-xs text-muted-foreground">{review.broker_email}</p>
                  </div>
                </TableCell>
                <TableCell><Badge variant="outline">{review.kind}</Badge></TableCell>
                <TableCell>
                  {new Date(
                    status === 'pending' ? review.submitted_at : review.reviewed_at ?? review.submitted_at,
                  ).toLocaleDateString('he-IL')}
                </TableCell>
                {status === 'rejected' && (
                  <TableCell className="max-w-xs text-sm text-muted-foreground">
                    {review.rejection_reason}
                  </TableCell>
                )}
                {showActions && (
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleApprove(review.id)}>
                        <CheckCircle className="h-4 w-4" />
                        אשר
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleReject(review.id)}>
                        <XCircle className="h-4 w-4" />
                        דחה
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <div className="flex flex-wrap gap-3">
        {status !== 'pending' && (
          <Link to="/admin/pending">
            <Button variant="outline">
              <Clock className="h-4 w-4" />
              ממתינים לאישור
            </Button>
          </Link>
        )}
        {status !== 'approved' && (
          <Link to="/admin/approved">
            <Button variant="outline">
              <CheckCircle className="h-4 w-4" />
              מאושרים היום
            </Button>
          </Link>
        )}
        {status !== 'rejected' && (
          <Link to="/admin/rejected">
            <Button variant="outline">
              <XCircle className="h-4 w-4" />
              דחויים היום
            </Button>
          </Link>
        )}
        <Link to="/admin/properties">
          <Button variant="outline">ניהול נכסים</Button>
        </Link>
      </div>
    </div>
  );
}
