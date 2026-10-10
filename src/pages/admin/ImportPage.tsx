import { AlertTriangle, CheckCircle, FileUp, Upload, XCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { useAuth } from '../../contexts/AuthContext';
import {
  csvToDealRecords,
  detectDuplicateTitles,
  parseCsvText,
  validateDealRows,
  type DealImportPreview,
} from '../../lib/import/propertyDealCsv';
import { fetchAdminProfiles } from '../../lib/services/adminUsersService';
import { fetchImportBatches, runAdminPropertyImport } from '../../lib/services/adminImportService';
import { ServiceError } from '../../lib/services/serviceHelpers';

type Step = 'upload' | 'preview' | 'result';

export function AdminImportPage() {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('upload');
  const [filename, setFilename] = useState('');
  const [preview, setPreview] = useState<DealImportPreview | null>(null);
  const [duplicateIssues, setDuplicateIssues] = useState<ReturnType<typeof detectDuplicateTitles>>([]);
  const [brokers, setBrokers] = useState<{ id: string; label: string }[]>([]);
  const [brokerId, setBrokerId] = useState('');
  const [history, setHistory] = useState<Awaited<ReturnType<typeof fetchImportBatches>>>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ imported: number; failed: number; duplicates: number } | null>(
    null,
  );

  const loadHistory = useCallback(async () => {
    try {
      setHistory(await fetchImportBatches());
    } catch {
      setHistory([]);
    }
  }, []);

  const loadBrokers = useCallback(async () => {
    try {
      const profiles = await fetchAdminProfiles();
      const list = profiles
        .filter((p) => ['broker', 'owner', 'admin', 'superadmin'].includes(p.role))
        .map((p) => ({
          id: p.id,
          label: `${p.full_name || p.email} (${p.role})`,
        }));
      setBrokers(list);
      if (user?.id && !brokerId) {
        const self = list.find((b) => b.id === user.id);
        setBrokerId(self?.id ?? list[0]?.id ?? user.id);
      }
    } catch {
      if (user?.id) setBrokerId(user.id);
    }
  }, [brokerId, user?.id]);

  useEffect(() => {
    loadHistory();
    loadBrokers();
  }, [loadHistory, loadBrokers]);

  const parseFile = async (file: File) => {
    setError('');
    setMessage('');
    const text = await file.text();
    const table = parseCsvText(text);
    const records = csvToDealRecords(table);
    if (!records.length) {
      setError('לא זוהו עמודות תקינות. נדרשות לפחות: כותרת, עיר, מחיר');
      return;
    }
    const validated = validateDealRows(records);
    const dupes = detectDuplicateTitles(validated.valid);
    setFilename(file.name);
    setPreview(validated);
    setDuplicateIssues(dupes);
    setStep('preview');
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
    e.target.value = '';
  };

  const confirmImport = async () => {
    if (!preview?.valid.length || !brokerId) return;
    setLoading(true);
    setError('');
    try {
      const res = await runAdminPropertyImport(filename, preview.valid, brokerId);
      setResult(res);
      setMessage(`יובאו ${res.imported} רשומות בהצלחה`);
      setStep('result');
      await loadHistory();
    } catch (err) {
      setError(err instanceof ServiceError ? err.message : 'הייבוא נכשל');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="ייבוא עסקאות" description="ייבוא קובץ CSV של נכסים / עסקאות" />

      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">העלאת קובץ</CardTitle>
          </CardHeader>
          <CardContent>
            <label
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-12 transition-colors hover:border-primary/50"
            >
              <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
              <p className="mb-2 font-medium">גרור קובץ CSV לכאן או לחץ לבחירה</p>
              <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileInput} />
              <span className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                <FileUp className="h-4 w-4" />
                בחר קובץ
              </span>
            </label>
            <p className="mt-4 text-xs text-muted-foreground">
              עמודות: title/כותרת, address/כתובת, city/עיר, price/מחיר, kind/סוג, status/סטטוס, date/תאריך (אופציונלי)
            </p>
            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>
      )}

      {step === 'preview' && preview && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">תצוגה מקדימה — {filename}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Badge variant="success">
                  <CheckCircle className="h-3 w-3" />
                  {preview.valid.length} תקינות
                </Badge>
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3" />
                  {preview.invalid.length} שגויות
                </Badge>
                {duplicateIssues.length > 0 && (
                  <Badge variant="warning">
                    <AlertTriangle className="h-3 w-3" />
                    {duplicateIssues.length} כפילויות בקובץ
                  </Badge>
                )}
              </div>

              <label className="block text-sm">
                <span className="text-muted-foreground">שייך נכסים למתווך:</span>
                <select
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
                  value={brokerId}
                  onChange={(e) => setBrokerId(e.target.value)}
                >
                  {brokers.map((b) => (
                    <option key={b.id} value={b.id}>{b.label}</option>
                  ))}
                </select>
              </label>

              {preview.invalid.length > 0 && (
                <div className="max-h-40 overflow-auto rounded-lg border border-border p-3 text-sm">
                  {preview.invalid.map((issue) => (
                    <p key={`${issue.rowNumber}-${issue.message}`} className="text-destructive">
                      שורה {issue.rowNumber}: {issue.message}
                    </p>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button onClick={confirmImport} disabled={loading || !preview.valid.length}>
                  {loading ? 'מייבא...' : 'אשר ייבוא'}
                </Button>
                <Button variant="outline" onClick={() => setStep('upload')}>ביטול</Button>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </CardContent>
          </Card>
        </div>
      )}

      {step === 'result' && result && (
        <Card>
          <CardContent className="space-y-2 p-6">
            <p className="font-medium text-success">{message}</p>
            <p className="text-sm text-muted-foreground">
              נכשלו: {result.failed} · כפילויות: {result.duplicates}
            </p>
            <Button variant="outline" onClick={() => { setStep('upload'); setPreview(null); }}>
              ייבוא נוסף
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">היסטוריית ייבוא</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {history.length === 0 ? (
            <EmptyState
              icon={FileUp}
              title="אין היסטוריה"
              description="לאחר ייבוא מוצלח תופיע כאן רשומת הבatch"
              className="py-8"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>קובץ</TableHead>
                  <TableHead>שורות</TableHead>
                  <TableHead>יובאו</TableHead>
                  <TableHead>שגיאות</TableHead>
                  <TableHead>תאריך</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.filename}</TableCell>
                    <TableCell>{row.total_rows}</TableCell>
                    <TableCell>
                      <Badge variant="success">{row.imported_rows}</Badge>
                    </TableCell>
                    <TableCell>
                      {row.failed_rows > 0 ? (
                        <Badge variant="destructive">{row.failed_rows}</Badge>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>{new Date(row.created_at).toLocaleDateString('he-IL')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Link to="/admin/properties"><Button variant="outline">ניהול נכסים</Button></Link>
        <Link to="/admin/pending"><Button variant="outline">ממתינים לאישור</Button></Link>
      </div>
    </div>
  );
}
