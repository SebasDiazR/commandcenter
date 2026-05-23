# HKS BD Command Center

Texas Higher Education Business Development Pipeline — FY 2026–2030

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Build & Deploy

```bash
npm run build    # production build
npm run start    # serve production build locally
```

Deploy to Vercel: push to GitHub, import repo at vercel.com, zero config needed.

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
