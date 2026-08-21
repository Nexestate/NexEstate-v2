import { useMemo, useState } from 'react';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { PageHero } from '../../components/market/PageHero';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { formatCurrency } from '../../lib/utils';

export function CalculatorPage() {
  const [price, setPrice] = useState('2000000');
  const [rent, setRent] = useState('8000');
  const [expenses, setExpenses] = useState('1500');
  const [downPayment, setDownPayment] = useState('500000');

  const results = useMemo(() => {
    const p = Number(price) || 0;
    const r = Number(rent) || 0;
    const e = Number(expenses) || 0;
    const d = Number(downPayment) || 0;
    const annualNet = (r - e) * 12;
    const grossYield = p > 0 ? ((r * 12) / p) * 100 : 0;
    const netYield = p > 0 ? (annualNet / p) * 100 : 0;
    const cashOnCash = d > 0 ? (annualNet / d) * 100 : 0;
    const paybackYears = annualNet > 0 ? p / annualNet : 0;
    return { annualNet, grossYield, netYield, cashOnCash, paybackYears };
  }, [price, rent, expenses, downPayment]);

  return (
    <PublicLayout>
      <PageHero
        title="מחשבון תשואה"
        subtitle="חשב תשואה ברוטו ונטו, Cash-on-Cash ותקופת החזר — בחינם"
      />

      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">פרטי הנכס</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input label="מחיר רכישה (₪)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
            <Input label="שכירות חודשית (₪)" type="number" value={rent} onChange={(e) => setRent(e.target.value)} />
            <Input label="הוצאות חודשיות (₪)" type="number" value={expenses} onChange={(e) => setExpenses(e.target.value)} />
            <Input label="הון עצמי (₪)" type="number" value={downPayment} onChange={(e) => setDownPayment(e.target.value)} />
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">תוצאות</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'הכנסה שנתית נטו', value: formatCurrency(results.annualNet) },
              { label: 'תשואה ברוטו', value: `${results.grossYield.toFixed(2)}%` },
              { label: 'תשואה נטו', value: `${results.netYield.toFixed(2)}%`, highlight: true },
              { label: 'Cash-on-Cash', value: `${results.cashOnCash.toFixed(2)}%` },
              { label: 'תקופת החזר', value: `${results.paybackYears.toFixed(1)} שנים` },
            ].map(({ label, value, highlight }) => (
              <div key={label} className="flex items-center justify-between rounded-xl border border-border bg-card/50 px-4 py-3">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className={`text-lg font-bold ${highlight ? 'text-success' : ''}`}>{value}</span>
              </div>
            ))}
            <Button className="w-full rounded-full">שמור חישוב</Button>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
}
