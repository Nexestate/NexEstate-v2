# NexEstate v2

מערכת ניהול נדל"ן — React 18 + TypeScript + Vite 6 + Tailwind CSS v4 + Supabase.

## התקנה

```bash
npm install
npm run dev
```

פתח [http://localhost:5173](http://localhost:5173)

## מצב Demo

ללא קובץ `.env` — האפליקציה רצה במצב Demo:
- **Login:** כל אימייל + סיסמה
- משתמש ברירת מחדל: מיכאל וינר (מתווך)
- נתוני דשבורד מ-`src/data/demoData.ts`

## Supabase

העתק `.env.example` ל-`.env.local` (או `.env`) והזן:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

הרץ את `schema.sql` ב-Supabase SQL Editor.

## מסלולים

| נתיב | תיאור |
|------|--------|
| `/` | דף נחיתה |
| `/login` | התחברות |
| `/register` | הרשמה |
| `/broker` | דשבורד מתווך |
| `/broker/properties` | נכסים ויחידות |
| `/broker/leads` | לידים (טבלה + קנבן) |
| `/broker/clients` | לקוחות |
| `/broker/leases` | חוזים |
| `/broker/tenants` | שוכרים |
| `/sign/demo-token` | חתימה דיגיטלית (Demo) |
| `/buyer` | דשבורד קונה |
| `/admin` | דשבורד אדמין |

## ספרינט 2 — מה נוסף

- דפי עומק למתווך: נכסים, לידים/לקוחות, חוזים/שוכרים
- עמוד חתימה דיגיטלית `/sign/:token`
- `schema.sql` + `src/lib/services/` (Supabase + Mock fallback)

## ספרינט 1 — מה נבנה

- Foundation & UI Kit
- Auth & ProtectedRoute (Demo + Supabase)
- Broker Dashboard (Home מלא)
- Buyer & Admin shells + Home
- Landing Page
