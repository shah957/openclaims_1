---
doc: 06-phase-1-foundation
depends_on:
  - 01-technical-architecture.md
  - 02-ui-ux-spec.md
referenced_by:
  - 07-phase-2-world-id.md
  - 08-phase-3-claims.md
  - 10-phase-5-organizer.md
  - 11-phase-6-polish.md
status: complete
---

# Phase 1 Foundation (Hours 0-4)

## 1. Project Initialization

```bash
npx create-next-app@latest openclaims-ops --typescript --tailwind --eslint --app --src-dir --use-pnpm
cd openclaims-ops
```

If scaffolding into the existing repo root instead of a subfolder, use the same flags with `.` and keep the `docs/` directory intact.

## 2. Dependency Installation

```bash
pnpm add @supabase/supabase-js @supabase/ssr @worldcoin/idkit @worldcoin/idkit-core openai resend react-dropzone recharts lucide-react clsx tailwind-merge class-variance-authority zod
pnpm add -D prettier shadcn
```

## 3. shadcn/ui Setup

```bash
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button card input label select textarea badge dialog dropdown-menu table tabs toast tooltip progress separator sheet avatar skeleton
```

## 4. Tailwind Configuration

`tailwind.config.ts`

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        foreground: "var(--color-text)",
        primary: "var(--color-primary)",
        accent: "var(--color-accent)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        error: "var(--color-error)",
        surface: "var(--color-surface)",
        muted: "var(--color-muted)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        glow: "0 20px 60px rgba(108, 99, 255, 0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
```

## 5. Global CSS

`src/app/globals.css`

```css
@import "tailwindcss";

:root {
  --color-primary: #1a1f36;
  --color-accent: #6c63ff;
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-background: #f8fafc;
  --color-surface: #ffffff;
  --color-text: #0f172a;
  --color-muted: #64748b;
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  min-height: 100vh;
  background:
    radial-gradient(circle at top right, rgba(108, 99, 255, 0.12), transparent 32%),
    linear-gradient(180deg, #ffffff 0%, #f8fafc 55%, #eef2ff 100%);
  color: var(--color-text);
}

a {
  color: inherit;
  text-decoration: none;
}
```

## 6. Supabase Setup

1. Create a new Supabase project.
2. Run the SQL from [01-technical-architecture.md](/Users/shilp/Drive1/Catapult Hacks/OpenClaims-main/docs/01-technical-architecture.md).
3. Create storage bucket `claim-documents`.
4. Copy project URL, anon key, and service role key into `.env.local`.
5. Test connectivity with a simple server-side `select 1` or `select id from programs limit 1`.

## 7. Environment Variables File

`.env.local.example`

```dotenv
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# World ID
NEXT_PUBLIC_WORLD_APP_ID=
NEXT_PUBLIC_WORLD_ENV=staging
WORLD_RP_ID=
WORLD_RP_SIGNING_KEY=

# AI / notifications
OPENAI_API_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# Demo
DEMO_SEED_ENABLED=false
```

## 8. Root Layout

`src/app/layout.tsx`

```tsx
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "OpenClaims Ops",
  description: "Automate claims, stipends, and reimbursements for open pools with World ID.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

## 9. Landing Page

`src/app/(public)/page.tsx`

```tsx
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-7xl px-6 py-8">
        <nav className="flex items-center justify-between rounded-full border border-slate-200/70 bg-white/80 px-5 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[--color-primary] text-sm font-semibold text-white">
              OC
            </div>
            <div>
              <p className="text-sm font-semibold">OpenClaims Ops</p>
              <p className="text-xs text-slate-500">Built for Catapult Hacks 2026</p>
            </div>
          </div>
          <div className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
            <a href="#how-it-works">How it works</a>
            <a href="#world-id">Why World ID</a>
            <Link className="rounded-full bg-[--color-primary] px-4 py-2 text-white" href="/auth">
              Create a Program
            </Link>
          </div>
        </nav>

        <section className="grid gap-10 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="inline-flex rounded-full border border-[--color-accent]/20 bg-[--color-accent]/10 px-4 py-2 text-sm font-medium text-[--color-accent]">
              Powered by World ID proof of personhood
            </p>
            <h1 className="mt-6 max-w-3xl text-5xl font-bold tracking-tight text-[--color-primary] md:text-6xl">
              Automate claims, stipends, and reimbursements for open pools.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Replace forms, spreadsheets, and manual review with a single flow:
              verify once, upload proof, run rules, approve clean claims instantly.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link className="rounded-full bg-[--color-primary] px-6 py-3 text-center font-medium text-white" href="/auth">
                Create a Program
              </Link>
              <a className="rounded-full border border-slate-300 bg-white px-6 py-3 text-center font-medium text-slate-700" href="#how-it-works">
                See the Flow
              </a>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-glow">
            <div className="grid gap-4">
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-sm font-medium text-slate-500">Program</p>
                <p className="mt-2 text-xl font-semibold">Catapult Meal Stipend</p>
                <p className="mt-1 text-sm text-slate-500">Max claim: $25 · Food only · Deadline Sunday 10 AM</p>
              </div>
              <div className="rounded-3xl border border-[--color-accent]/20 bg-[--color-accent]/5 p-5">
                <p className="text-sm font-medium text-[--color-accent]">World ID verified</p>
                <p className="mt-2 text-lg font-semibold text-[--color-primary]">One human, one claim.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-2xl font-bold text-[--color-success]">38</p>
                  <p className="text-sm text-slate-500">Auto-approved</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-2xl font-bold text-[--color-warning]">6</p>
                  <p className="text-sm text-slate-500">Flagged</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-2xl font-bold text-[--color-primary]">$712</p>
                  <p className="text-sm text-slate-500">Budget committed</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="grid gap-6 py-8 md:grid-cols-3">
          {[
            ["1", "Verify with World ID", "Claimants prove they are human before a form ever opens."],
            ["2", "Upload proof", "Receipts or invoices go straight into structured storage and extraction."],
            ["3", "Route automatically", "Clean claims auto-approve. Edge cases are flagged with context."],
          ].map(([step, title, description]) => (
            <article key={step} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-md">
              <p className="text-sm font-semibold text-[--color-accent]">Step {step}</p>
              <h2 className="mt-3 text-2xl font-semibold text-[--color-primary]">{title}</h2>
              <p className="mt-3 text-slate-600">{description}</p>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
```

## 10. Basic Routing Structure

Create these placeholder files immediately:

```tsx
export default function PlaceholderPage() {
  return <div className="p-8">Coming soon.</div>;
}
```

Use that template for:

- `src/app/(auth)/auth/page.tsx`
- `src/app/(dashboard)/dashboard/page.tsx`
- `src/app/(dashboard)/dashboard/programs/new/page.tsx`
- `src/app/(dashboard)/dashboard/programs/[id]/page.tsx`
- `src/app/(dashboard)/dashboard/programs/[id]/review/page.tsx`
- `src/app/(dashboard)/dashboard/programs/[id]/export/page.tsx`
- `src/app/(public)/claim/[slug]/page.tsx`
- `src/app/(public)/claim/[slug]/status/page.tsx`

## 11. Shared Components

Add first-pass versions of:

- `src/components/shared/navbar.tsx`
- `src/components/shared/footer.tsx`
- `src/components/shared/status-badge.tsx`

Keep them small and reusable. Use the design tokens from [02-ui-ux-spec.md](/Users/shilp/Drive1/Catapult Hacks/OpenClaims-main/docs/02-ui-ux-spec.md).

## 12. Acceptance Criteria

- `pnpm dev` runs without errors.
- Landing page renders with OpenClaims branding.
- All listed routes resolve.
- Supabase can connect from a server helper.
- `.env.local` values load through `process.env`.
