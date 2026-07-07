# Universal Document Intake + Smart Data Allocation
## Feasibility Report — HKS BD Command Center

**Prepared:** 2026-06-19  
**Scope:** Texas Higher-Ed BD Pipeline (expandable to CA, NC, and future states)  
**Codebase:** Next.js 14 + React + TypeScript + Supabase  

---

## 1. Executive Summary

**Verdict: Hybrid approach is the right call. No-AI first, Claude API on top.**

The Command Center already has a strong, type-safe data model with clear field definitions for institutions, projects, contacts, funding sources, and capture plans. Document intake is not only feasible — it is the logical next capability for a tool managing $50B+ in pipeline data that currently requires all input to be entered manually or hardcoded.

### What the data reveals

| Signal | Finding |
|--------|---------|
| `@anthropic-ai/sdk` | **Already in `package.json`** — zero new dependencies needed for Claude API |
| `jsPDF` | Already installed for PDF export — shows PDF ecosystem familiarity |
| `ExportModal.tsx` exports CSV | The column structure is ready to reverse into a CSV import |
| All data in `lib/data.ts` | Biggest bottleneck — hardcoded RAW_DATA is the single source of truth |
| No import UI exists | Greenfield feature — no legacy conflicts |
| `InstEditState` has 30+ fields | Rich enough data model to absorb most document types |
| Supabase persistence | Ready to store document metadata, import logs, audit trail |

### Recommended approach

```
Phase 1 → No-AI, structured files (CSV/XLSX/JSON)   ← Build now
Phase 2 → No-AI, semi-structured (PDF/DOCX text)    ← Build next
Phase 3 → Smart routing + duplicate detection        ← Build soon
Phase 4 → Claude API for ambiguous documents         ← Build when needed
Phase 5 → Advanced: bulk, lineage, ask-the-document  ← Future innovation
```

The no-AI path handles 70–80% of realistic imports (THECB spreadsheets, contact lists, project rosters, capital plans in CSV/XLSX). Claude API handles the remaining 20–30%: meeting notes, RFP documents, proposals, research briefs, and any unstructured text where meaning lives in context rather than column headers.

---

## 2. Recommended Architecture

### Full system overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    UPLOAD INTERFACE                              │
│  Drag-and-drop zone + file picker + paste-from-clipboard        │
│  Supported: CSV, XLSX, XLS, JSON, PDF, DOCX, DOC, TXT          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   FILE PARSER LAYER                              │
│  CSV → papaparse       │  PDF → pdf.js (pdfjs-dist)            │
│  XLSX/XLS → xlsx       │  DOCX → mammoth                       │
│  JSON → native         │  TXT → native FileReader              │
│                        │  DOC → mammoth (partial)              │
│  Output: { rawText, tables: Row[][], mimeType, fileName }       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                DATA EXTRACTION LAYER                             │
│  Structured files → column mapper (CSV/XLSX/JSON)               │
│  Text files       → keyword + regex extractor                   │
│  Ambiguous files  → Claude API (optional, user-triggered)       │
│  Output: ExtractedRecord[] with field, value, confidence, source│
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│               CLASSIFICATION / ROUTING LAYER                     │
│  Match extracted fields → Command Center modules                 │
│  Institution matcher (fuzzy name match against known list)       │
│  Field classifier (budget → project, date → timeline, etc.)     │
│  Confidence scorer (0.0–1.0 per field and per record)           │
│  Duplicate detector (compare against existing Supabase data)     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    REVIEW QUEUE                                  │
│  Table showing: extracted value | proposed field | destination   │
│  Confidence indicator (green/yellow/red)                         │
│  Manual correction inline                                        │
│  Accept all / reject all / edit per row                         │
│  Unknown fields → "Unclassified" staging area                   │
└────────────────────────┬────────────────────────────────────────┘
                         │ User approves
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                 SAVE-TO-DATABASE LAYER                           │
│  Merge approved records into EditStateMap                        │
│  POST /api/edits (existing endpoint)                            │
│  Write import log: { importId, filename, timestamp, userId,     │
│    recordsImported, recordsSkipped, recordsFailed }             │
│  Update Supabase document_imports table (new table)             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  IMPORT HISTORY PANEL                            │
│  List of past imports with filename, date, record count         │
│  Re-open any import for audit                                   │
│  Rollback individual import (planned — Phase 3)                 │
└─────────────────────────────────────────────────────────────────┘
```

### New files to create

```
app/api/import/route.ts             ← POST: accepts file, returns extraction result
app/api/import/history/route.ts     ← GET: import log
components/ImportModal.tsx          ← Primary upload UI (mirrors ExportModal pattern)
components/import/FileDropZone.tsx  ← Drag-and-drop zone
components/import/ColumnMapper.tsx  ← Manual column → field mapping UI
components/import/ReviewQueue.tsx   ← Extracted data approval table
components/import/ImportHistory.tsx ← Past imports panel
lib/import/fileParser.ts           ← Dispatch by MIME type
lib/import/csvParser.ts            ← papaparse wrapper
lib/import/xlsxParser.ts           ← xlsx wrapper
lib/import/pdfParser.ts            ← pdfjs-dist wrapper
lib/import/docxParser.ts           ← mammoth wrapper
lib/import/textParser.ts           ← Plain text regex extractor
lib/import/columnMapper.ts         ← Auto-map column headers to fields
lib/import/fieldClassifier.ts      ← Keyword/regex router
lib/import/institutionMatcher.ts   ← Fuzzy name matcher
lib/import/confidenceScorer.ts     ← Per-field confidence scoring
lib/import/claudeExtractor.ts      ← Claude API integration (isolated, opt-in)
lib/import/types.ts                ← ImportResult, ExtractedRecord, ImportLog types
```

### Files to modify

```
components/BDCommandCenter.tsx      ← Add showImport state, ImportModal trigger button
components/ExportModal.tsx          ← (No change needed; used as UI pattern reference)
app/api/edits/route.ts              ← Possibly extend to accept batch import payload
lib/types.ts                        ← Add ImportLog, ExtractedRecord, DocumentSource types
lib/persistence.ts                  ← Add saveImportLog(), loadImportHistory()
```

### New Supabase tables

```sql
-- Import audit trail
CREATE TABLE document_imports (
  import_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state_id      text NOT NULL DEFAULT 'tx',
  filename      text NOT NULL,
  file_type     text NOT NULL,
  imported_at   timestamptz DEFAULT now(),
  imported_by   text,
  records_total int,
  records_saved int,
  records_skipped int,
  records_failed int,
  ai_assisted   boolean DEFAULT false,
  raw_extracted jsonb
);

-- Optional: document source references (for data lineage)
CREATE TABLE document_sources (
  source_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id     uuid REFERENCES document_imports(import_id),
  institution_name text,
  field_path    text,       -- e.g. "projects[0].budget_m"
  source_value  text,
  page_number   int,
  confidence    float
);
```

---

## 3. No-AI Implementation Path

### What deterministic parsing can do

| File Type | Library | What It Can Extract Reliably | Cannot Reliably Handle |
|-----------|---------|-------------------------------|------------------------|
| **CSV** | `papaparse` | Column-structured data with named headers: institution name, project name, budget, date, contact | Unstructured notes columns, merged cells |
| **XLSX / XLS** | `xlsx` (SheetJS) | Named sheets, cell values, merged cells, basic formulas | Charts, embedded images, pivot tables |
| **JSON** | Native `JSON.parse` | Any well-formed JSON matching Command Center schema | Arbitrary or deeply nested schemas |
| **TXT** | Native + regex | Bullet lists, labeled fields ("Institution: UT Austin"), dates, dollar amounts | Narrative paragraphs, implicit context |
| **PDF (digital)** | `pdfjs-dist` | Text content, table text extraction, metadata | Scanned images, complex column layouts, footnotes mixed with body |
| **DOCX** | `mammoth` | Paragraphs, headings (H1–H4), tables, bold/italic markers | Complex multi-column layouts, embedded Excel tables, track-changes |
| **DOC** | `mammoth` | Basic text content | Most formatting, headers/footers, tables |
| **RTF** | Custom (limited) | Plain text fallback | Structure and tables |

### Recommended parsing libraries

```bash
npm install papaparse @types/papaparse    # CSV parsing (100KB, zero deps)
npm install xlsx                          # XLSX/XLS/CSV parser (SheetJS community edition)
npm install pdfjs-dist                    # Mozilla PDF.js for browser-side PDF text extraction
npm install mammoth                       # DOCX → clean HTML/text converter
# No new install needed for JSON, TXT — native FileReader + JSON.parse
```

### How far no-AI gets us

**Fully addressable without AI (high confidence):**

1. **THECB Capital Expenditure Plan (XLSX)** — The primary source data. Column-mapped directly to `RawProject` fields. This alone handles the biggest data refresh scenario.
2. **Contact roster (CSV)** — Maps directly to `RawContact[]` per institution.
3. **Project tracker (XLSX)** — Column-mapped to `RawProject` fields with budget, year, type, stage.
4. **Institution list (CSV)** — Maps to `RawInstitution` base fields.
5. **Custom Command Center export → re-import** — Full round-trip since we control the export format.
6. **JSON snapshots** — Any JSON conforming to `RawData`, `RawInstitution`, or `RawProject` schema.

**Partially addressable without AI (medium confidence, needs review queue):**

1. **THECB PDF reports** — Text extraction gets 80% of content; table borders and footnotes cause noise.
2. **Meeting notes (DOCX)** — Can extract bullet points and action items; cannot infer which institution a paragraph refers to without context.
3. **RFP documents (PDF)** — Can extract dates, dollar amounts, deadlines; cannot classify which project the RFP belongs to.
4. **Research reports (PDF)** — Good for funding figures and named institutions; narrative context is lost.

**Requires AI (low deterministic confidence):**

1. **Handwritten or scanned PDFs** — No text to extract without OCR.
2. **Proposal documents** — Meaning lives in narrative; fields must be inferred from prose.
3. **Email threads** — Multi-turn context, implicit institution references.
4. **Meeting transcripts** — Action items require inference from speaker intent.
5. **Mixed-structure reports** — Institutional strategy documents, master plans.
6. **Cross-document synthesis** — "What does this research brief mean for our UT Austin strategy?"

### No-AI column mapping logic

For CSV/XLSX files with named headers, auto-map using normalized string matching:

```typescript
// lib/import/columnMapper.ts — deterministic header mapping
const COLUMN_ALIASES: Record<string, string> = {
  // Institution fields
  "institution name": "name", "school": "name", "university": "name", "college": "name",
  "system": "system", "ut system": "system",
  "total pipeline": "thecb_total_m", "capital plan": "thecb_total_m", "total (m)": "thecb_total_m",
  "lead practice": "lead_practice", "practice": "lead_practice",
  // Project fields
  "project name": "project.name", "project": "project.name",
  "budget": "project.budget_m", "budget (m)": "project.budget_m", "cost (m)": "project.budget_m",
  "fiscal year": "project.year", "fy": "project.year", "year": "project.year",
  "type": "project.type", "project type": "project.type",
  "stage": "project.pursuit_stage", "pursuit stage": "project.pursuit_stage",
  "win probability": "project.win_probability", "probability": "project.win_probability",
  // Contact fields
  "contact": "contact.name", "contact name": "contact.name",
  "contact notes": "contact.notes", "notes": "contact.notes",
  // Funding
  "funding source": "funding.name", "source": "funding.source",
};
```

### No-AI text extraction for PDF/DOCX

```typescript
// lib/import/fieldClassifier.ts — regex-based field extraction from text
const FIELD_PATTERNS = [
  { field: "institution.name",    regex: /(?:institution|university|college|school):\s*([^\n]+)/i },
  { field: "project.budget_m",    regex: /\$\s*([\d,]+(?:\.\d+)?)\s*(?:million|M)\b/gi },
  { field: "project.year",        regex: /\bFY\s*20(2[4-9]|3\d)\b/gi },
  { field: "project.name",        regex: /(?:project|facility|building):\s*([^\n]+)/i },
  { field: "contact.name",        regex: /(?:contact|poc|point of contact|vp|avp|president):\s*([^\n]+)/i },
  { field: "capture.decision_date", regex: /(?:decision|award|rfp\s*due):\s*([\w\s,]+\d{4})/i },
  { field: "capture.pain_points", regex: /(?:challenge|issue|pain point|problem):\s*([^\n]+)/i },
];
```

This gets useful data out of THECB PDFs, master plan excerpts, and meeting notes — but everything extracted this way should go through the review queue with medium confidence scores.

---

## 4. Claude API Implementation Path

### When to invoke Claude

Claude API is invoked **only on user request** (never automatically) when:

1. The file is a PDF/DOCX/TXT with narrative content
2. Regex extraction produces < 3 reliable fields
3. The user clicks "Analyze with AI" in the review queue
4. The document is a proposal, report, research brief, or meeting notes

The `@anthropic-ai/sdk` is **already installed** in `package.json`. The only requirement is an `ANTHROPIC_API_KEY` in `.env.local`.

### API workflow

```
1. File uploaded → parser extracts raw text and tables
2. Text sent to Claude with a structured extraction prompt
3. Claude returns JSON conforming to our extraction schema
4. JSON merged with regex extraction results (Claude gets higher confidence)
5. Merged result displayed in review queue for user approval
6. User edits, approves, or rejects before anything saves
```

### Prompting strategy

```typescript
// lib/import/claudeExtractor.ts
const EXTRACTION_PROMPT = `
You are a data extraction assistant for an architecture firm's business development pipeline.

Extract structured information from the following document. Return ONLY valid JSON matching the schema below.

SCHEMA:
{
  "institutions": [{
    "name": string,               // Full institution name
    "system": string | null,      // University system (e.g. "UT System")
    "contacts": [{ "name": string, "notes": string }],
    "projects": [{
      "name": string,
      "budget_m": number | null,  // Budget in millions of dollars
      "year": number | null,      // Fiscal year (e.g. 2027)
      "type": string | null,      // "New Construction" | "Renovation" | "Infrastructure"
      "notes": string | null
    }],
    "notes": string | null,       // General strategy notes
    "capture_hints": {            // Capture plan hints if present
      "known_needs": string | null,
      "pain_points": string | null,
      "decision_date": string | null,
      "who_we_know": string | null
    }
  }],
  "funding_sources": [{ "name": string, "total_m": number }],
  "confidence": {
    "overall": number,            // 0.0 to 1.0
    "notes": string               // e.g. "Meeting notes with clear action items"
  }
}

RULES:
- If a field is not present in the document, set it to null
- Do not invent values — only extract what is explicitly stated
- Convert all dollar amounts to millions (e.g. "$50 million" → 50)
- For fiscal years, extract the year number only (e.g. "FY2027" → 2027)
- If multiple institutions are mentioned, include all of them
- Unknown or ambiguous data belongs in "notes" fields
- Mark overall confidence low (< 0.5) if the document is ambiguous

DOCUMENT:
${documentText}
`;
```

### Cost control strategy

| Control | Implementation |
|---------|---------------|
| **User-triggered only** | No automatic Claude calls; always requires "Analyze with AI" click |
| **Text chunking** | Split documents > 80K chars into semantic chunks; process per section |
| **Caching** | Cache extraction results by file hash (SHA-256); skip re-analysis on re-upload |
| **Model selection** | Use `claude-haiku-4-5` for routine extraction; `claude-sonnet-4-6` for complex documents |
| **Token estimation** | Show estimated cost before confirming ("~$0.003 to analyze this document") |
| **Monthly budget cap** | Optional env var `ANTHROPIC_MONTHLY_LIMIT_USD` with circuit breaker in API route |
| **Batch mode** | Queue multiple files; process during off-hours rather than real-time |

### Privacy strategy

```
NEVER send to Claude API:
- Personally identifiable contacts (strip before sending, re-merge after)
- Authenticated Supabase tokens or API keys
- HKS proprietary pricing, margins, or internal fee structures
- Documents marked as "Confidential" without explicit consent

Strip sensitive fields with a pre-processor before sending text:
- Replace contact phone/email with [CONTACT_REDACTED]
- Replace SSNs with [SSN_REDACTED]
- Replace internal cost rates with [RATE_REDACTED]
```

### Human approval process (non-negotiable)

```
Claude extracts data → Review Queue shows all proposed changes →
User sees: "Proposed: UT Austin | Austin Sciences Building | $45M | FY2027" →
User can: ✓ Accept | ✗ Reject | ✏️ Edit inline →
Only after explicit "Import N records" click does data enter Supabase
```

No record is ever written without explicit user approval. Ambiguous records go to an "Unclassified" section in the review queue for manual disposition.

---

## 5. Data Allocation Logic

### Routing model: extracted content → Command Center modules

| Extracted Signal | Target Module | Target Field | Notes |
|-----------------|---------------|--------------|-------|
| Institution name | `EnrichedInstitution` | `name` / `edit.displayName` | Fuzzy match against known list first |
| University system | `EnrichedInstitution` | `system` | Normalized: "UT System", "A&M System", etc. |
| Project name | `RawProject` | `name` | Appended to institution's `projects[]` |
| Budget / fee / cost | `RawProject` | `budget_m` | Normalized to millions |
| Fiscal year | `RawProject` | `year` | Integer 2024–2032 |
| Project type | `RawProject` | `type` | Matched to known types via `inferPractice()` |
| Pursuit stage | `RawProject` | `pursuit_stage` | "Tracking" / "Shortlist" / etc. |
| Win probability | `RawProject` | `win_probability` | 0–100% → decimal |
| Contact name + role | `RawContact` | `name` + `notes` | Appended to institution's `contacts[]` |
| Next action / deadline | `InstEditState` | `next_action` + `next_action_date` | |
| Strategy notes / pain points | `CapturePlan` | `pain_points` / `known_needs` | |
| Decision date | `CapturePlan` | `decision_date` | |
| RFP timeline | `CapturePlan` | `decision_date` + `notes` | |
| Known decision makers | `CapturePlan` | `who_we_know` / `who_we_need` | |
| Preferred delivery method | `CapturePlan` | `delivery_method` | |
| HKS past projects | `CapturePlan` | `work_history` | |
| Funding source | `RawData.funding_sources[]` | `FundingSource` | Global dataset, not per-institution |
| State location | `StateConfig` | State page routing | Texas/California/etc. |
| Geographic coordinates | `InstitutionMap` | Map view | Lat/lng extraction from address |
| Research reference | Review queue → strategy notes | Manually routed | Never auto-saved |
| Unknown / ambiguous | Unclassified queue | User disposition | |

### Institution name matching

Fuzzy matching against the existing 60+ institution list is critical. A THECB spreadsheet may say "The University of Texas at Austin" while the database says "UT Austin."

```typescript
// lib/import/institutionMatcher.ts
// Uses Levenshtein distance + known alias map
const INSTITUTION_ALIASES: Record<string, string> = {
  "university of texas at austin": "UT Austin",
  "ut austin": "UT Austin",
  "texas a&m university": "Texas A&M",
  "texas a & m": "Texas A&M",
  "texas am university": "Texas A&M",
  // ... full alias table
};

function matchInstitution(raw: string, knownNames: string[]): MatchResult {
  const normalized = raw.toLowerCase().trim();
  // 1. Exact alias match
  if (INSTITUTION_ALIASES[normalized]) return { name: INSTITUTION_ALIASES[normalized], confidence: 1.0 };
  // 2. Fuzzy Levenshtein match
  const best = knownNames.map(n => ({ n, score: levenshtein(normalized, n.toLowerCase()) }))
    .sort((a, b) => a.score - b.score)[0];
  if (best.score <= 3) return { name: best.n, confidence: 0.85 };
  if (best.score <= 6) return { name: best.n, confidence: 0.60 };
  return { name: raw, confidence: 0.0, isNew: true }; // New institution candidate
}
```

### Confidence scoring model

```
1.0 — Exact schema match (JSON upload conforming to our types)
0.9 — Named CSV column match (header = known alias)
0.8 — Claude extraction from clean PDF/DOCX
0.7 — Claude extraction from mixed/complex document
0.6 — Regex extraction from structured text
0.5 — Regex extraction from narrative text
0.3 — Partial fuzzy match (institution name ~similar)
0.0 — Unknown / cannot classify

Review queue shows:
Green  (≥ 0.8) — "High confidence, safe to import"
Yellow (0.5–0.8) — "Review before importing"
Red    (< 0.5) — "Verify carefully; high chance of error"
```

---

## 6. UI/UX Concept

### Design language

The intake feature should match the Command Center's dark UI with CSS custom property theming (`var(--bg-surface)`, `var(--text-1)`, `var(--accent-primary)`). Use the same Framer Motion animation patterns already in `BDCommandCenter.tsx`. Mirror the `ExportModal.tsx` panel structure but with a multi-step wizard pattern.

### Upload entry point

**Location:** Next to the "Export" button in the top navigation bar of `BDCommandCenter.tsx`.

```
[  BD Command Center  ]  [Matrix] [List] [Timeline] ... | [Import ↑] [Export ↓] [Save]
```

Clicking "Import ↑" opens `ImportModal.tsx` as a full-screen overlay (same animation as ExportModal).

### Step 1: File drop zone

```
┌─────────────────────────────────────────────────────────────────┐
│  ╔═══════════════════════════════════════════════════════════╗  │
│  ║                                                           ║  │
│  ║              ↑  Drop your file here                       ║  │
│  ║                                                           ║  │
│  ║       or  [ Browse files ]  or  [ Paste from clipboard ]  ║  │
│  ║                                                           ║  │
│  ║   Supported: CSV · XLSX · XLS · JSON · PDF · DOCX · TXT  ║  │
│  ║                                                           ║  │
│  ╚═══════════════════════════════════════════════════════════╝  │
│                                                                  │
│  Recent imports:                                                 │
│  ↳ thecb_capital_plan_2026.xlsx — June 12 — 403 projects        │
│  ↳ ut_system_contacts.csv — June 8 — 14 contacts                │
└─────────────────────────────────────────────────────────────────┘
```

### Step 2: Parsing progress

```
┌─────────────────────────────────────────────────────────────────┐
│  Parsing: thecb_capital_plan_2026.xlsx                          │
│                                                                  │
│  ████████████████████████████░░░░░   85%                        │
│                                                                  │
│  ✓ File type detected: Excel Workbook                           │
│  ✓ 4 sheets found — using "Capital Plan 2026-2030"              │
│  ✓ 403 rows extracted                                           │
│  ⏳ Matching institution names...                               │
│                                                                  │
│  [ Cancel ]                                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Step 3: Column mapper (CSV/XLSX only)

Shown when column headers don't auto-map with 100% confidence.

```
┌─────────────────────────────────────────────────────────────────┐
│  Map columns to Command Center fields                            │
│                                                                  │
│  FILE COLUMN          →   COMMAND CENTER FIELD                  │
│  ─────────────────────────────────────────────────────────────  │
│  Institution           →  [Institution Name        ▾]  ✓        │
│  FY2027 Project        →  [Project Name            ▾]  ✓        │
│  Budget ($M)           →  [Project Budget (M)      ▾]  ✓        │
│  Delivery              →  [Delivery Method         ▾]  ✓        │
│  Campus                →  [Skip this column        ▾]  —        │
│  Contact Person        →  [Contact Name            ▾]  ✓        │
│  Notes / Other         →  [Institution Notes       ▾]  ⚠        │
│                                                                  │
│  [ ← Back ]                  [ Preview extracted data → ]       │
└─────────────────────────────────────────────────────────────────┘
```

### Step 4: Review queue

The core of the feature. Every proposed change is visible before anything saves.

```
┌─────────────────────────────────────────────────────────────────┐
│  Review extracted data  ·  403 records  ·  14 need attention    │
│                                                                  │
│  Filter: [All ▾] [Institutions] [Projects] [Contacts] [Funding] │
│                                                                  │
│  ──────────────────────────────────────────────────────────────  │
│  ● UT Austin                Institution  •  Already exists       │
│    └─ Austin Sciences Bldg  Project      +  New · $45M · FY2027  │
│    └─ Moody Ctr Expansion   Project      ~  Update · $12M→$14M   │ ⚠
│                                                                  │
│  ● Texas A&M                Institution  •  Already exists       │
│    └─ Health Sciences Bldg  Project      +  New · $120M · FY2028 │
│                                                                  │
│  ● West Texas A&M           Institution  ?  No match (NEW)       │ ⚠
│    └─ Academic Complex      Project      +  New · $28M · FY2026  │
│                                                                  │
│  [!] 3 records unclassified — review required                   │
│                                                                  │
│  [ Accept all high confidence ]  [ Review all ]  [ Cancel ]     │
│                          [ Import 400 records → ]               │
└─────────────────────────────────────────────────────────────────┘
```

**Icons:**
- `+` New record (will be added)
- `~` Update to existing record (diff shown on hover)
- `?` Unmatched institution (user must confirm or create new)
- `!` Conflict or error

### Step 5: Conflict resolution

When an existing field would be overwritten:

```
┌─────────────────────────────────────────────────────────────────┐
│  Moody Center Expansion — budget conflict                        │
│                                                                  │
│  Current value:   $12M                                          │
│  Imported value:  $14M                                          │
│  Source: thecb_capital_plan_2026.xlsx, row 47                   │
│                                                                  │
│  [ Keep current $12M ]  [ Use imported $14M ]  [ Enter custom ] │
└─────────────────────────────────────────────────────────────────┘
```

### Step 6: Import summary

```
┌─────────────────────────────────────────────────────────────────┐
│  ✓ Import complete                                               │
│                                                                  │
│  400 records imported                                            │
│  12 records updated                                              │
│  3 records skipped (user chose not to import)                   │
│  0 errors                                                        │
│                                                                  │
│  Source: thecb_capital_plan_2026.xlsx                           │
│  Imported: June 19, 2026 at 11:42 AM                            │
│                                                                  │
│  [ View import history ]  [ Undo this import ]  [ Done ]        │
└─────────────────────────────────────────────────────────────────┘
```

### AI assistance toggle (Step 4, for PDF/DOCX)

```
┌──────────────────────────────────────────────────────────────────┐
│  Only 4 fields extracted from this PDF.                          │
│  This document contains narrative content that may hold more.    │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  ✨ Analyze with Claude AI                                   │ │
│  │  Estimated cost: ~$0.002  ·  Est. time: 8 seconds           │ │
│  │  Claude will read the full document and extract additional   │ │
│  │  structured data. You'll still review before importing.     │ │
│  │  Your document is sent to Anthropic's API and not retained.  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  [ Analyze with AI ]   [ Skip — manual entry ]                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 7. Quick Wins

These can be built in 1–5 days each and deliver immediate value:

| Win | Effort | Value | Notes |
|-----|--------|-------|-------|
| **CSV import** (column-mapped) | 2 days | Very High | Handles THECB spreadsheets directly |
| **XLSX import** | 1 day | Very High | Same as CSV; xlsx library parses both |
| **JSON import** | 0.5 days | High | Schema-conforming round-trip import |
| **Upload drawer UI** | 1 day | High | File drop zone + progress bar |
| **Column mapper UI** | 1.5 days | High | Maps headers to fields |
| **Review queue table** | 2 days | Very High | Core approval workflow |
| **Import history panel** | 1 day | Medium | Audit trail for accountability |
| **Parsed-data preview** | 0.5 days | High | Shows extracted data before commit |
| **ExportModal reverse** | 0.5 days | High | Use existing CSV export format as import template |
| **Institution fuzzy matcher** | 1 day | Very High | Prevents duplicate creation |

**Total quick-win MVP: ~10–11 days of focused development.**

---

## 8. Phased Roadmap

### Phase 1 — Reliable structured import (2–3 weeks)

**Goal:** Any THECB CSV/XLSX file can be imported in < 5 minutes with user review.

Deliverables:
- `ImportModal.tsx` with drag-and-drop + file picker
- `FileDropZone.tsx` component
- `csvParser.ts` + `xlsxParser.ts` using papaparse + xlsx
- `columnMapper.ts` auto-mapping with `ColumnMapper.tsx` UI for exceptions
- `ReviewQueue.tsx` with accept/reject/edit-inline per row
- `institutionMatcher.ts` fuzzy match against current institution list
- `ImportHistory.tsx` listing past imports
- Supabase `document_imports` table + POST `/api/import` route
- JSON import (schema-validated)
- TXT import (raw paste, manual field assignment)

Packages to add:
```bash
npm install papaparse @types/papaparse xlsx
```

---

### Phase 2 — Semi-structured document parsing (2–3 weeks)

**Goal:** PDFs and DOCX files can be dropped in and yield useful pre-filled data.

Deliverables:
- `pdfParser.ts` using `pdfjs-dist` (browser-side, no server needed)
- `docxParser.ts` using `mammoth` (DOCX → clean text + table extraction)
- `fieldClassifier.ts` regex/keyword extraction engine
- `confidenceScorer.ts` per-field confidence (0–1 scale)
- Review queue extended with confidence indicators (green/yellow/red)
- "Unclassified" staging area for unrouted data
- Per-record source citation (filename + page number)

Packages to add:
```bash
npm install pdfjs-dist mammoth
```

---

### Phase 3 — Smart routing + duplicate detection (2 weeks)

**Goal:** The system learns from past imports; prevents creating duplicate institutions or projects.

Deliverables:
- Duplicate detection: compare extracted records against all existing Supabase data before surfacing
- Conflict resolution UI (current vs. imported diff with choose-or-edit)
- Field-level merge strategy (additive for contacts/projects, overwrite-with-confirm for scalars)
- Import rollback: store pre-import snapshot per import_id; allow undo
- Institution alias table expansion (editable in settings)
- Data lineage: field tooltip shows "Imported from thecb_plan.xlsx on June 12"

---

### Phase 4 — Claude API intelligence (1–2 weeks)

**Goal:** Ambiguous, narrative, or multi-source documents are handled intelligently.

Deliverables:
- `claudeExtractor.ts` calling `claude-haiku-4-5` for extraction
- Pre-processor that strips PII before sending to API
- Cost estimator shown before API call
- SHA-256 file hash cache (avoid re-analyzing same file)
- Monthly budget cap with circuit breaker
- `ANTHROPIC_API_KEY` isolated in `.env.local` (already supported by Next.js)
- Claude-assisted institution matching for novel names
- Confidence boosting: Claude results override regex results at same field

Note: `@anthropic-ai/sdk` is **already in `package.json`**. Only the API key and the extractor module are needed.

---

### Phase 5 — Advanced innovation (ongoing)

**Goal:** The Command Center becomes a living, document-fed intelligence system.

Deliverables:
- Bulk upload (multiple files processed as a queue)
- "Ask this document" interface — chat with uploaded PDFs about BD strategy
- Automatic project/opportunity creation from RFP announcements
- Document-to-dashboard: upload a capital plan, get a pre-populated institution view
- Source citations in tooltips throughout the app ("This project budget sourced from thecb_2026.xlsx p.47")
- Data lineage graph: show which fields came from which documents
- Email/calendar integration: paste email threads, extract next actions and contacts
- Scheduled imports: auto-pull from known THECB URLs on a cadence
- Import template library: shareable mapping presets for common document types
- Mobile upload: capture a photo of a whiteboard or business card; OCR + extract

---

## 9. Implementation Recommendation

### Final answer: Hybrid — No-AI now, Claude API when needed

The Command Center's biggest data bottleneck is the hardcoded `lib/data.ts`. Every THECB refresh, every new state page, every contact update requires manual editing of TypeScript source files. This is unsustainable at scale.

**The no-AI path solves 70–80% of that problem immediately.** THECB publishes its Capital Expenditure Plans as XLSX files. Those files, column-mapped, directly populate `RawProject[]` and `RawInstitution[]` fields without any AI. This alone is a game-changing capability for the pipeline.

**The Claude API path handles the rest.** Meeting notes, proposals, research briefs, and strategy documents are where the most nuanced BD intelligence lives — and where regex extraction fails. Claude can read a 40-page campus master plan and return a structured JSON object with institution name, projects, budgets, contacts, and strategic pain points. The Anthropic SDK is already installed. The only gate is an API key and the extractor module.

**The review queue is non-negotiable.** No document import should ever write to the database without human approval. The Command Center tracks $50B+ in real business development pipeline. A bad import that corrupts institution data, overwrites manually-entered strategy notes, or creates duplicate projects would be seriously damaging. Every record must be visible, editable, and explicitly approved before saving.

---

## Required packages summary

| Package | Purpose | Phase |
|---------|---------|-------|
| `papaparse` + `@types/papaparse` | CSV parsing | Phase 1 |
| `xlsx` (SheetJS) | XLSX/XLS parsing | Phase 1 |
| `pdfjs-dist` | PDF text extraction (browser-side) | Phase 2 |
| `mammoth` | DOCX → clean text + tables | Phase 2 |
| `@anthropic-ai/sdk` | Claude API (already installed) | Phase 4 |

No new packages needed for JSON or TXT — native browser APIs handle both.

---

## Risks and decisions needed before implementation

| Risk | Severity | Decision Needed |
|------|----------|----------------|
| THECB column headers vary year to year | Medium | Build editable alias table; don't hardcode exact header strings |
| PDF text extraction quality varies by PDF generator | Medium | Test with actual THECB PDFs; document known limitations |
| Institution name matching fails on new institutions | High | Define "create new vs. skip" policy for unmatched names |
| Importing overwrites manually entered strategy notes | High | Field-level merge strategy: additive vs. overwrite policy |
| Claude API key in `.env.local` not committed | Low | Already handled by Next.js `.gitignore`; add warning to README |
| Large XLSX files (> 50MB) cause browser OOM | Low | Add client-side file size limit (20MB max); stream large files to server |
| Duplicate projects created with slightly different names | High | Fuzzy project name matching must be implemented before Phase 1 ships |
| Import rollback is complex if downstream edits happened | Medium | Store pre-import snapshot; warn if rollback would overwrite later edits |
| Scanned PDFs have no text layer | Medium | Add OCR notice in UI; Phase 5 candidates for Tesseract.js integration |
| Multi-state imports (CA, NC files into TX state) | Low | Validate state prefix before importing; default to current active state |

---

## Summary answers

### What is possible now, without AI

- XLSX/CSV import of THECB Capital Expenditure Plan → auto-populates projects + institutions
- CSV import of contact lists → populates `RawContact[]` per institution
- JSON import of any schema-conforming data snapshot
- PDF text extraction → surfaces dates, dollar amounts, institution names, and deadlines via regex
- DOCX text extraction → extracts bullet points, action items, and labeled fields
- Column mapper UI for any structured file with non-standard headers
- Full review queue: approve/reject/edit before saving
- Import history and audit trail in Supabase

### What requires AI

- Narrative documents where meaning lives in prose rather than structure
- Meeting notes → action items + institution attribution
- Proposals and RFPs where project details are embedded in descriptive text
- Cross-document synthesis ("what does this report mean for our UT strategy?")
- Scanned PDFs (requires OCR first, then LLM extraction)
- Ambiguous institution matching at the edge of the fuzzy match threshold

### What the first prototype should be

**A CSV/XLSX import flow for THECB Capital Expenditure Plan data.**

This is the highest-value, lowest-risk first build. It directly addresses the hardcoded `lib/data.ts` bottleneck. It requires no AI, no new risky dependencies, and the type system already fully supports the data shape.

Prototype scope (1 week):
1. `ImportModal.tsx` — upload button + file drop zone
2. `xlsxParser.ts` — parse THECB XLSX → rows
3. `columnMapper.ts` + `ColumnMapper.tsx` — map columns to `RawProject` fields
4. `institutionMatcher.ts` — fuzzy-match against known institution list
5. `ReviewQueue.tsx` — show extracted records, allow accept/reject
6. Wire into `BDCommandCenter.tsx` → on confirm, merge into `editState` → trigger autosave

### Files that would need to be modified

1. `components/BDCommandCenter.tsx` — Add `showImport` state + "Import" button in nav
2. `lib/types.ts` — Add `ImportLog`, `ExtractedRecord`, `DocumentSource` types
3. `lib/persistence.ts` — Add `saveImportLog()` for audit trail
4. `app/api/edits/route.ts` — Optionally extend for batch import payload

### Files to create (Phase 1 prototype)

```
components/ImportModal.tsx
components/import/FileDropZone.tsx
components/import/ColumnMapper.tsx
components/import/ReviewQueue.tsx
lib/import/fileParser.ts
lib/import/csvParser.ts
lib/import/xlsxParser.ts
lib/import/columnMapper.ts
lib/import/institutionMatcher.ts
lib/import/types.ts
app/api/import/route.ts
```

---

*This report was produced from a full codebase audit on 2026-06-19.  
All library recommendations are compatible with Next.js 14 App Router and the existing TypeScript strict-mode configuration.*
