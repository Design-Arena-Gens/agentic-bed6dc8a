## Business Expense Manager

Mobile-first expense tracking dashboard for cleaning and operations businesses. Capture purchases across materials, chemicals, logistics, payroll, and advances while routing access through Super Admin, Admin, and User profiles.

### Key Features

- Dynamic expense form that adjusts available types based on the selected category (Material, Chemical, Transport, Vegetables, Groceries, Rent, Marketing, Salary, Advance)
- Conditional "Others" workflow that prompts for additional detail when required
- Secure document upload to Supabase Storage with signed URLs
- Role-aware listings: Super Admin sees every record, Admin/User scope to their profile
- Summary KPIs for total, monthly, and top category spending

### Project Structure

```
src/
  app/            # App Router pages and server actions
  components/     # Reusable UI (form, summary cards, listings, role switcher)
  lib/            # Shared utilities, Supabase helpers, constants
supabase/         # SQL migrations (tables, seed data, storage bucket)
```

### Environment Variables

Copy `.env.local.example` to `.env.local` and provide credentials from your Supabase project:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SUPABASE_EXPENSE_BUCKET=expense-documents
```

> The service role key is required for server actions that insert rows and upload files. Never expose it to the browser.

### Supabase Setup

Apply the SQL in `supabase/0001_create_business_expenses.sql` using the Supabase SQL editor or CLI. This migration:

- Creates the `business_expenses` ledger table
- Seeds canonical profiles (`Super Admin`, `Admin`, `User`)
- Provisions a private `expense-documents` storage bucket

### Development

Install dependencies and start the local dev server:

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to interact with the dashboard. Use the role chip selector in the header to swap between Super Admin, Admin, and User perspectives.

### Testing & Linting

- `npm run lint` — run ESLint across the project
- `npm run build` — ensure the production bundle compiles cleanly

### Deployment

The app is optimized for Vercel. Once environment variables are configured in the Vercel dashboard, deploy with:

```bash
vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-bed6dc8a
```

After deployment propagates, verify uptime via:

```bash
curl https://agentic-bed6dc8a.vercel.app
```

### Authentication & Security

- Supabase Row Level Security (RLS) rules are not included; add them if you plan to use auth-based multi-tenancy.
- Generated signed URLs expire after 1 hour; adjust in `src/app/page.tsx` if you need longer-lived links.
