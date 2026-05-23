# HKS BD Command Center

Texas Higher Education Business Development Pipeline — FY 2026–2030

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Authentication

This app uses Clerk for sign-in and only allows users whose primary email ends with `@hksinc.com`.

Required environment variables:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

Notes:

- The current code-level guard works on standard Clerk plans.
- If you want to stop outsiders from even creating accounts, enable Clerk's allowlist in the Clerk dashboard and add `*@hksinc.com`.

## Build & Deploy

```bash
npm run build    # production build
npm run start    # serve production build locally
```

Deploy to Vercel:

1. Push the repo to GitHub.
2. Import the repo into Vercel.
3. Create a Clerk application.
4. Add the Clerk environment variables to the Vercel project.
5. Redeploy.

After deploy, anyone with an `@hksinc.com` email can sign in and view the site.

## Stack

- Next.js 14 (App Router)
- React 18 + TypeScript
- recharts (charts)
- lucide-react (icons)
- jspdf (PDF generation — runs entirely in browser)

## Key Files

| File | Purpose |
|------|---------|
| `lib/data.ts` | GLOSSARY + full RAW_DATA (THECB + strategy session) |
| `lib/persistence.ts` | localStorage save/load + undo stack helpers |
| `components/BDCommandCenter.tsx` | Main orchestrator — all state lives here |
| `components/ExportModal.tsx` | PDF export modal with section/scope/format selection |
| `components/DetailPanel.tsx` | Slide-over with full field editing |
| `components/views/` | 8 view components (Matrix, Ecosystem, Timeline, etc.) |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+S` | Save to localStorage |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
