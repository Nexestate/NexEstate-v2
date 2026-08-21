import { CheckCircle, FileUp, Upload, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { DEMO_IMPORT_HISTORY } from '../../data/demoData';
import { useState } from 'react';

export function AdminImportPage() {
  const [dragOver, setDragOver] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const handleUpload = () => {
    setUploaded(true);
    setTimeout(() => setUploaded(false), 3000);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="ייבוא עסקאות" description="ייבוא קובץ CSV של עסקאות נדל&quot;ן" />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">העלאת קובץ</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-colors ${
              dragOver ? 'border-primary bg-primary/5' : 'border-border'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(); }}
          >
            <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
            <p className="mb-2 font-medium">גרור קובץ CSV לכאן</p>
            <p className="mb-4 text-sm text-muted-foreground">או לחץ לבחירת קובץ</p>
            <Button onClick={handleUpload}>
              <FileUp className="h-4 w-4" />
              {uploaded ? 'הועלה בהצלחה!' : 'בחר קובץ'}
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            פורמט נתמך: CSV עם עמודות — תאריך, כתובת, עיר, מחיר, סוג, סטטוס
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">היסטוריית ייבוא</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
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
              {DEMO_IMPORT_HISTORY.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.filename}</TableCell>
                  <TableCell>{row.rows}</TableCell>
                  <TableCell>
                    <Badge variant="success">
                      <CheckCircle className="h-3 w-3" />
                      {row.imported}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {row.errors > 0 ? (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3" />
                        {row.errors}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>{new Date(row.created_at).toLocaleDateString('he-IL')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Link to="/admin/properties"><Button variant="outline">ניהול נכסים</Button></Link>
        <Link to="/admin/pending"><Button variant="outline">ממתינים לאישור</Button></Link>
      </div>
    </div>
  );
}
