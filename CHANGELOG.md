# Changelog

Every change to this project is recorded here (newest first). Read this file at the start of each session.

## 2026-07-19 — Open KYC case creation to every staff role

Root-caused the manager's earlier "error when opening the KYC model[/modal]" complaint: creating a new
Individual or Corporate KYC case was hardcoded to Front-Office-only at every layer (middleware, page,
server action, and the workflow state machine itself) — any other role (including the Administrator
account the manager was using) got silently redirected away, which reads as "broken" with no error
message explaining why. The user asked directly: open case creation to all roles, individual and
corporate both.

- **`src/lib/workflow.ts`**: `ACTION_ROLES` changed from `Record<WorkflowAction, Role>` (one role per
  action) to `Record<WorkflowAction, Role[]>` — `SUBMIT` now allows all four roles; `COMPLIANCE_APPROVE`/
  `REJECT`/`RETURN` stay Compliance-Officer-only and `MANAGER_APPROVE`/`REJECT` stay Senior-Manager-only
  (widening *who can create/submit* was the ask, not *who can approve*). `canEditCase()` dropped its
  `role === 'FRONT_OFFICE'` check entirely — editing a DRAFT/RETURNED case is now gated purely on being
  its maker, regardless of role.
- Removed the now-redundant `/cases/new` and `/cases/[id]/edit` entries from `src/middleware.ts`'s
  `ROLE_RULES` (any authenticated staff role passes; the maker check is the real gate) and widened the
  matching `requireSession(['FRONT_OFFICE'])` calls in `cases/actions.ts`, `corporate-actions.ts`, and
  the two page components to `requireSession()` (any authenticated role).
- **Found and fixed a second, pre-existing gap while in this code**: Corporate KYC creation had no
  reachable UI entry point at all, for any role — no nav item, no dashboard link, only the individual
  "New Case" button existed. Added "New Corporate KYC" buttons/quick-links alongside "New Individual
  KYC" on both the Cases list page and the Dashboard, for every role.
- Heads-up (not implemented, flagging for awareness): there's no "can't review your own case" guard, so
  a Compliance Officer or Admin can now create a case and also approve/reject it themselves — a real
  maker-checker segregation gap if that matters for this deployment. Wasn't asked for here.
- Verified: `tsc` clean, 118/118 tests pass (workflow.test.ts updated — two tests previously asserted
  the old Front-Office-only restriction, now assert all four roles can create/edit/submit as long as
  they're the maker), `next build` succeeds, and a live check confirmed a Compliance Officer session
  can now reach both `/cases/new` and `/cases/new?type=CORPORATE` (previously a redirect for that role).

## 2026-07-19 — Visual retheme to match the reference platform

The manager reviewed the deployed system and rejected it on sight: "It is not what we want... the
functionality and design is different from what we expected." The user then shared fresh screenshots of
the reference platform (the same one at 167.172.101.3:3000 referenced throughout this project's history,
previously inaccessible). Comparing page-by-page: every module shown in the reference already exists in
this app (List Screening, Sanctions Lists, Risk Assessment/CRA, Transaction Monitoring, Alerts, Cases,
STR Reports, Reports & Analytics, Screening Rules Sandbox, Settings) — the actual gap was purely visual.
KYC-specific complaints were explicitly deferred by the user ("forget about kyc" for now).

- **Retheme**: sidebar changed from a blue gradient to a near-black slate (`#0f172a` → `#020617`);
  primary color from deep royal blue to cyan-blue (`#0891b2`); accent from restrained gold to teal
  (`#0d9488`) — both in `globals.css`'s `@theme` defaults and `BRAND_DEFAULTS` (`src/lib/constants.ts`,
  so Settings > Branding's "Reset to Default" now resets to this look, not the old one).
- **Sidebar active-item highlight now uses `color-mix(in srgb, var(--color-accent) 24%, transparent)`**
  instead of a neutral white overlay, so the active nav item reads as a teal-tinted highlight (matching
  the reference) rather than a generic gray one.
- **Brand mark replaced**: the gold gradient + `ShieldCheck` icon is gone, replaced with a solid teal
  square showing an "AM" monogram (sidebar top, login page desktop + mobile) — matching the reference
  exactly. Falls back to this whenever no custom logo has been uploaded via Settings > Branding.
- **Brand name changed to "AML" / "COMPLIANCE PLATFORM"** (was "AML System" / "KYC Compliance") — and
  deliberately kept identical in both `en.ts` and `ar.ts`, since the reference platform's brand mark
  stays in Latin script even in its Arabic UI. A product/brand name isn't content that gets translated.
- Several hardcoded `text-blue-*` utility classes in the sidebar (group labels, nav item text, collapse
  button) were tied to the old blue-gradient theme and would have clashed against the new near-black
  background — swapped for neutral `text-slate-*` shades.
- Client portal (`/portal/*`) intentionally left untouched — the manager's screenshots were all
  internal-staff-app pages; the portal wasn't part of this complaint.
- Verified: `tsc` clean, 117/117 tests pass, confirmed via the rendered `<html style>` attribute and
  literal "AM"/"COMPLIANCE PLATFORM" text in the served HTML that the new values are actually live
  (no screenshot tool available in this environment — this was a curl/HTML-attribute check, not a
  pixel-level visual diff; a real look should still be given by whoever reviews it next).

## 2026-07-19 — Batch transaction import (CSV), for client-facing showcasing

The manager wants to show the platform to actual clients and raised the real question of how a
client's transactions would get into the system — API integration with their core-banking system, or
batch file drops. That's genuinely their/the client's IT team's call, not one this session could answer
for them — but batch import is buildable and honest *right now* (a live API needs a real external
system to call, which doesn't exist), so built that as the concrete answer.

- **New `src/lib/transactions/csv.ts`**: a hand-rolled, dependency-free CSV parser (quoted fields, `""`
  escaping, CRLF/LF, BOM-stripping) plus a transaction-import-specific validator, matching this
  codebase's established style for pure/unit-tested engines (`iban.ts`, `risk/engine.ts`,
  `screening/similarity.ts`, `transactions/rules.ts`). 14 new Vitest tests.
- **New `importTransactionsBatch` action** (`src/lib/transactions/actions.ts`): resolves each row's
  `caseNumber` to an approved `KycCase`, then runs every row through **the exact same `evaluateRule()`
  pipeline** manual entry uses — in chronological order per case, seeded with that case's real prior
  transaction history — so a batch-imported transaction and a manually-recorded one are screened
  identically and structuring/velocity detection works correctly across a historical batch. Invalid
  rows (bad case number, unapproved client, invalid type/amount/date) are skipped individually with a
  reason, not a whole-file rejection.
- **New "Import CSV" dialog** on `/transactions`, next to "Record Transaction": downloadable CSV
  template, file upload, and a results summary (rows imported, alerts triggered, skipped rows with
  reasons).
- New `TRANSACTION_BATCH_IMPORTED` audit action (plus the usual per-row `TRANSACTION_RECORDED`/
  `ALERT_CREATED` entries, tagged `source: batchImport` in their details for traceability).
- Verified: `tsc` clean, 117/117 tests pass (was 103), `next build` succeeds, and a DB-level simulation
  against a real approved case confirmed structuring and large-transaction detection both fire
  correctly on imported historical rows, invalid rows are correctly skipped, and unrelated case numbers
  are correctly rejected.

## 2026-07-16 — Manager feedback: interactive KPI cards, branding, and a test-flakiness fix

Feedback from the manager's first live walkthrough (via the user): make the dashboard KPI cards
interactive on hover, and confirm/expand admin capabilities (creating staff accounts, customizable
colors, uploadable logo).

- **Admin staff-account creation already existed** (Settings > Users & Permissions, `createStaffUser`,
  ADMIN-only) — verified live with a minted admin session rather than rebuilt.
- **Interactive KPI cards**: every dashboard stat card (`StatCard`) now shows a hover/focus popover with
  a risk-rating breakdown (LOW/MEDIUM/HIGH counts within that card's own filter) — computed live via a
  new `riskBreakdown()` helper in `src/app/(app)/page.tsx`, not fabricated. Popover opens on `hover` and
  `focus-within` (keyboard-accessible, not mouse-only) via pure CSS, no extra JS state.
  `src/components/stat-card.tsx` gained `breakdown`/`breakdownTitle` props.
- **New Settings > Branding & Appearance tab** (ADMIN-only), the site's first real theming surface:
  - **Colors**: primary, accent, and sidebar-gradient (top/bottom) — 4 native `<input type="color">`
    pickers with live client-side preview (writes straight to `document.documentElement.style` before
    Save is even clicked) and a "Reset to Default" button. `globals.css`'s derived tokens
    (`--color-primary-hover`, `--color-primary-soft`, `--color-accent-soft`) now use `color-mix()`
    against the base color instead of separately hardcoded hex values, so they automatically stay in
    sync with whatever the admin picks — no second set of colors to keep in sync by hand.
  - **Logo upload**: PNG/JPEG/WebP/SVG up to 2MB, written to `public/uploads/brand-logo.<ext>` (plain
    static file — a logo isn't sensitive, so no encryption/auth-gated route needed, unlike KYC
    documents). A version counter busts the browser cache on re-upload.
  - Both stored as plain `SystemSetting` rows (`brandPrimaryColor`, `brandAccentColor`,
    `brandSidebarFromColor`, `brandSidebarToColor`, `brandLogoFile`, `brandLogoVersion`) — no schema
    migration needed.
- **Applied globally, not just in Settings**: the root layout (`src/app/layout.tsx`) reads brand colors
  via a new `getBrandSettings()` (wrapped in React's `cache()` so the handful of call sites in one
  request share a single DB read) and sets them as an **inline `style` on `<html>`** — inline style always
  wins over the stylesheet's `:root` defaults regardless of load order, so this is deterministic with no
  cascade-ordering risk (the alternative, injecting a `<style>` tag, would have been). The logo is threaded
  through to `AppShell` (sidebar brand mark) and rendered directly in the login page (both the desktop
  brand panel and the mobile compact header) — falls back to the original shield icon when unset.
- **Bug fix, unrelated to this feature**: `src/lib/transactions/rules.test.ts`'s "excludes transactions
  outside the time window" test mixed a fixed fixture date (`2026-07-16T12:00:00Z`) with a real
  `Date.now()`-based offset for one transaction in the same test — worked by coincidence when written
  (when real time ≈ the fixture date) but started failing as real time drifted past it. Anchored that
  offset to the same fixed date instead.
- Verified: `tsc` clean, 103/103 tests pass (after the above fix), and the branding round-trip (color
  update + logo upload + reset) was verified directly against the DB and by fetching the login page and
  dashboard with a minted admin session cookie — confirmed the `<html style>` attribute and `<img>` logo
  tag both reflected the change, then reset to the original navy/gold defaults before handing back.

## 2026-07-16 — Realistic demo dataset for manager walkthroughs

- **Fixed a real runtime bug**: `interpolate()` lived in `src/lib/i18n/client.tsx` (a `'use client'`
  module), so client components could call it fine, but three Server Component pages
  (`risk-assessment`, `reports-analytics`, `str-reports`) calling it directly during server render hit
  *"Attempted to call interpolate() from the server but interpolate is on the client."* Moved the pure
  function to a new boundary-free `src/lib/i18n/interpolate.ts` and repointed those three pages at it;
  `client.tsx` re-exports it for the client components that already imported it from there.
- **New `prisma/seed-data/demo.ts`**: a rich, fictional demo dataset (16 individual + 6 corporate KYC
  cases across every status/risk band, transactions, screening rules, emergent alerts, investigations,
  STR reports, CRA scores) so the platform shows real, populated charts/queues instead of empty states.
  Every number is *computed*, not hand-picked: profiles are fed through the actual `assessRisk`/
  `assessCorporateRisk` engine, transactions are run through the real `evaluateRule` screening logic
  transaction-by-transaction (so alerts emerge exactly as they would in production), and CRA
  bands/review dates come from the real `craBandFromScore`/`nextCraReviewDate` helpers. Guarded by a
  `demoDataSeeded` system setting so re-running `npx prisma db seed` never duplicates it or touches the
  user's own real cases — it only ever adds rows, continuing the same counters real usage relies on.
- **Bug caught and fixed before it shipped**: the first pass used `KW` (Kuwait) as the counterparty
  country on routine domestic transactions, assuming it was risk-free since it's the app's domestic
  country. But Kuwait is itself FATF grey-listed in this app's seeded data, and — unlike the onboarding
  risk engine — the transaction-monitoring `HIGH_RISK_COUNTRY` rule has no domestic exemption. That
  flooded the demo with 27 near-duplicate high-risk-jurisdiction alerts on almost every transaction.
  Fixed by giving domestic cash/internal transactions no counterparty country at all (the realistic
  choice — a walk-in cash deposit has no counterparty jurisdiction) and only ever using genuinely clean
  countries (`AE`/`GB`/`US`) for routine wires, reserving `IR`/`LB` for the deliberate high-risk scenarios.
  Re-verified: 9 alerts total (2 high-risk-jurisdiction, 5 large-transaction, 2 structuring) — a
  realistic, demo-appropriate mix instead of noise.
- Verified: `tsc` clean, 103/103 tests pass, a DB-level check confirmed case/alert/investigation/STR/CRA
  counts match the intended design, and every Module 4 page (dashboard, risk-assessment, transactions,
  alerts, investigations, str-reports, reports-analytics, screening-rules, screening, sanctions-lists)
  was fetched with a minted staff session cookie and returned 200 with no runtime errors.
- Noted for the user, not acted on: the DB also has ~12 pre-existing cases from earlier manual testing,
  including several empty `DRAFT` cases with no profile data — left untouched since they predate this
  session's changes and deleting test data isn't a call to make unilaterally.

## 2026-07-16 — Reports & Analytics (Phase 6 — final phase of the AML-platform parity roadmap)

- **New `/reports-analytics`**: date-range selector (7/30/90 days), 4 stat cards (Total Transactions,
  Transaction Value, STRs Submitted, Alerts — all scoped to the selected range), a KYC Status breakdown
  (reuses the existing `StatusBreakdownChart` from the main dashboard — same real data, consolidated
  reporting view, not a duplicate/fake chart) and a new Alert Volume by Category chart
  (`AlertVolumeChart`, added alongside the existing dashboard charts, following the same
  dataviz-validated color/style conventions).
- **"Export PDF"** is the browser's native print-to-PDF (`window.print()`), not a new PDF-generation
  dependency — a real, working export. The sidebar and header are marked `print:hidden` so the printed/
  saved output is just the report content, not the app chrome.
- Verified: `tsc` clean, `next build` succeeds (24 routes, +1), 103/103 tests pass, a DB-level check
  confirmed the overview/KYC-status/alert-volume queries correctly reflect newly created test data.

**This completes the 6-phase AML-platform parity roadmap** (Settings/RBAC → Sanctions/PEP Screening →
Ongoing Risk Assessment → Transaction Monitoring/Rules/Alerts → Case Management/STR → Reports). Honesty
notes carried through every phase, worth restating here: EU/UK sanctions lists are marked "Linking" (real
free feeds, registration step not built); PEP/Adverse Media are marked "Unavailable" (no free source
exists anywhere, real vendors are paid feeds); SSO/API Integrations/Notifications/Form Customization in
Settings are explicit "Coming Soon" stubs; screening rules are structured/parameterized rather than a
free-text DSL (avoids an eval-style injection surface); Transaction Monitoring's "live" feed is
auto-refresh polling, not a websocket push; and `ScreeningRule.action`'s `CREATE_STR` option stays
disabled pending a product decision on auto-generated STR narratives.

## 2026-07-16 — Case Management + STR Reports (Phase 5 of the AML-platform parity roadmap)

- **New `/investigations` (Case Management)**: a *different* concept from the existing KYC `KycCase`
  onboarding workflow — this is what an escalated Alert becomes once compliance starts working it.
  New/Investigating/Awaiting Approval/Closed kanban, matching the reference exactly. An "Alerts Awaiting
  Escalation" panel lists open/in-review alerts with no investigation yet; escalating creates an
  `InvestigationCase` (ref `INV-YYYY-NNNNN`) and moves the alert to In Review. Since `Alert` has no
  direct FK to `KycCase` (it's a two-hop chain through `Transaction`), the client link is denormalized
  onto `InvestigationCase.kycCaseId` at escalation time rather than re-derived on every read.
- **New `/str-reports`**: Suspicious Transaction Reports filed with the FIU. Creatable standalone
  against any approved client, or linked to an open investigation — the reference platform's own
  "+ New STR Report" button implied both paths, so both are supported. In Preparation → Under Review →
  Submitted, matching the reference's stat cards.
- `ScreeningRule.action` already had a `CREATE_STR` option sitting disabled since Phase 4 ("coming in a
  later phase") — still not wired to auto-file an STR from a rule match; that would need product
  judgment on what an auto-generated STR narrative should say, left as a manual step for now rather than
  guessed at.
- `AuditLog.caseId` is hard-wired to `KycCase` only (no polymorphic FK) — new `ALERT_ESCALATED`,
  `INVESTIGATION_STATUS_CHANGED`, `STR_CREATED`, `STR_STATUS_CHANGED` audit events are all logged
  against the client's `KycCase`, which is the correct and only sensible target for them anyway.
- Verified: `tsc` clean, `next build` succeeds (23 routes, +2), 103/103 tests pass (no new pure-logic
  algorithms this phase — mostly workflow/CRUD wiring reusing Phase 1-4 patterns). A DB-level check
  replayed the full lifecycle: alert → escalated to investigation (alert correctly flips to IN_REVIEW) →
  investigation moved through all four statuses → STR filed, linked, and submitted → investigation
  closed — every step verified against the real database.

## 2026-07-16 — Transaction Monitoring, Screening Rules, and Alerts (Phase 4 of the AML-platform parity roadmap)

The biggest piece of the roadmap — this app had zero transaction data or rule-engine concept before
today. New models: `Transaction`, `ScreeningRule`, `Alert`, `TransactionCounter`.

- **New `/transactions`**: no core-banking feed exists (or is realistic to fake), so transactions are
  entered manually via a real "Record Transaction" form — an honest, actually-usable data-entry point
  rather than a decorative seeded-only feed. Every recorded transaction is immediately screened against
  all ACTIVE rules. The "Live" badge from the reference platform is relabeled "Auto-refreshing": this app
  has no websocket/SSE backend, so the page polls (`router.refresh()` every 15s) rather than truly
  streaming — a real, working behavior, just not literally a push feed.
- **New `/screening-rules` (Sandbox)**: a rule editor with **structured, parameterized rules — not a
  free-text DSL that gets parsed/eval'd.** The reference platform's example rule (IF/THEN pseudocode) is
  shown as a read-only, generated preview for visual parity, but the actual executable logic is three
  concrete, hand-rolled rule types (`src/lib/transactions/rules.ts`, unit-tested, 10 tests): velocity+sum
  (structuring — N+ transactions of a type within a time window summing between two bounds), large
  single transaction, and high-risk counterparty jurisdiction (reuses the existing `Country.fatfStatus`
  data from Phase 1/Module 1). Evaluating arbitrary rule text would be a real injection surface if the
  parser had any gap; a structured builder has no such surface. Rules save as DRAFT, then
  Activate/Disable — "Create STR" as a rule action is visibly present but disabled, since STR reporting
  is Phase 5.
- **New `/alerts`**: every rule match creates an Alert (severity/type inherited from the rule).
  Compliance can mark alerts In Review → Resolved/Dismissed with notes; filterable by severity, matching
  the reference's tab layout.
- Front Office can record transactions and view monitoring (an operational task); Alerts and Rules
  management are compliance/admin-only.
- Verified: `tsc` clean, `next build` succeeds (21 routes, +4), 103/103 tests pass (10 new — rule engine,
  covering the structuring window/sum boundaries, type filtering, and FATF-status matching). A DB-level
  check replayed the reference's own example exactly: five KD 1,900 cash deposits — no alert on any of
  the first four (sum below 8,000), the fifth crosses the threshold (sum 9,500) and fires exactly one
  CRITICAL structuring alert, which was then resolved correctly.
- **Caught and fixed a route-collision bug before it shipped**: `/screening-rules` would have silently
  inherited the broader `/screening` middleware rule's roles (including SENIOR_MANAGER) due to
  first-match-wins prefix matching — reordered so the more specific pattern is checked first.

## 2026-07-16 — Ongoing Risk Assessment / CRA (Phase 3 of the AML-platform parity roadmap)

- **New `/risk-assessment`**: perpetual re-scoring of already-**APPROVED** clients, separate from the
  one-time onboarding decision made at submission. Deliberately reuses the exact same engine calls the
  onboarding wizard already uses (`profileToForm`/`corporateProfileToForm` → `buildRiskInput` →
  `assessRisk`/`assessCorporateRisk`) rather than a second, independently-tuned scoring system — one
  source of truth for "what counts as risky," now run against a client's *current* profile data instead
  of only their submission-time snapshot.
- **New 4-band CRA bucketing** (`src/lib/risk/cra.ts`, unit-tested): Low/Medium/High/Critical from the
  same 0–100+ score, with a review cadence per band (annual/annual/6-months/quarterly) — additive and
  local to this module, not a change to the onboarding engine's existing LOW/MEDIUM/HIGH rating (which
  other already-shipped code depends on: `StatusBadge`, the maker→checker→approver escalation logic,
  the corporate wizard). Two different presentations of one engine, not two engines.
- **"Recalculate All"** (button, matching the reference platform exactly) re-scores every approved
  client and writes `craScore`/`craBand`/`craLastAssessedAt`/`craNextReviewAt` on `KycCase`. No
  cron/scheduler infrastructure exists in this app, so this is a manual admin/compliance-triggered
  action, not a background job — noted as a known limitation rather than silently pretending it's
  automatic.
- Assessment-factors panel shows the *real* weights from `RISK_POINTS` (our actual engine), not the
  reference screenshot's example numbers — those two systems' weights are naturally different, and
  faking a match would be dishonest.
- Verified: `tsc` clean, `next build` succeeds (18 routes, +1), 93/93 tests pass (2 new — CRA banding/
  cadence), a DB-level check confirmed a PEP + FATF-blacklisted test client scores 100 and buckets into
  CRITICAL as expected.

## 2026-07-15 — Sanctions/PEP List Screening (Phase 2 of the AML-platform parity roadmap)

- **New `/screening` (List Screening)**: fuzzy-match a name/entity against loaded sanctions lists.
  Hand-rolled, dependency-free matching engine (`src/lib/screening/similarity.ts`, unit-tested) —
  Jaro-Winkler + token-set similarity (handles reordered given/family names), with an honest "Arabic
  Normalization" toggle (unifies common Arabic letter-form variants — أ/إ/آ→ا, ة→ه, ى→ي — and strips
  tashkeel; this is real Arabic name-matching normalization, not full phonetic transliteration, which
  has no free/maintained library — labeled accordingly rather than overclaiming). "Network Analysis" is
  shown disabled with a "coming soon" badge rather than a checkbox that silently does nothing.
- **New `/sanctions-lists` (browse)**: paginated, searchable view of every loaded record.
- **Real data, not fabricated**: seeded from actual public, no-registration OFAC SDN and UN Consolidated
  List XML feeds (fetched 2026-07-14/15, snapshotted — not a live daily sync), 140 genuine records in
  `prisma/seed-data/sanctions.ts`. EU Consolidated and UK HMT/OFSI are marked "Linking" (both are real,
  free feeds but need a registration step not yet built); PEP Worldwide and Adverse Media are marked
  "Unavailable" — there is no free equivalent for either anywhere; production compliance tools buy these
  from Refinitiv/Dow Jones/ComplyAdvantage-style vendors. All six statuses live in
  `src/lib/screening/lists.ts` and match the reference platform's own presentation of what's loaded vs.
  pending vs. unavailable.
- **New `SanctionedEntity` model** (`fullName`, `aliasesJson`, `listSource`, `entityType`, `programs`,
  `nationality`, `dob`). Every screening search is logged to the existing audit trail
  (`SANCTIONS_SCREENED`, query + threshold + result count — not the full result set).
- Verified: `tsc` clean, `next build` succeeds (17 routes, +2), 91/91 tests pass (9 new — similarity
  engine, including a real bug caught during testing: NFKD-decomposed Arabic hamza/tashkeel marks fall
  outside a Latin-only diacritics range and were splitting words in two). A DB-level check confirmed
  real matches against the seeded OFAC data (e.g. "Osama Bin Laden" → 100% via a listed alias) and zero
  false positives for an unrelated name.

## 2026-07-15 — Settings module (Phase 1 of a full AML-platform parity roadmap)

User asked to bring this system to parity with a broader AML compliance platform (sanctions screening,
transaction monitoring, case management, STR reporting, analytics — see reference screenshots). Given
the size, agreed to build it out module by module rather than all at once. This is phase 1 of 6.

- **New `/settings` module** (ADMIN-only, gated in `middleware.ts`): a left-nav of tabs mirroring the
  reference platform — **Users & Permissions**, **Audit Log**, and **Security & Compliance** are fully
  functional; **Lists & Data** is functional for what we already store (FATF country risk list, screening
  settings); **Authentication (SSO)**, **API Integrations**, **Notifications**, and **Form Customization**
  are explicit "Coming Soon" stubs — being upfront that those need real external integrations, not faked.
- **Users & Permissions**: create staff users, change role, activate/deactivate — first write-path onto
  the `User` table (previously only ever read for login). Guards against demoting/deactivating the last
  active ADMIN. All actions logged to the audit trail (`USER_CREATED`, `USER_ROLE_CHANGED`,
  `USER_ACTIVATED`, `USER_DEACTIVATED`).
- **Audit Log**: the first *cross-case* viewer — previously `AuditLog` was only ever shown scoped to one
  case's timeline. Filterable by action/date range, paginated. New `AuditLog` indexes (`createdAt`,
  `[actorId, createdAt]`) to support this.
- **Security & Compliance**: real self-service password change; session/rate-limit policy shown
  read-only; 2FA marked not-yet-available rather than a fake toggle.
- **Lists & Data**: FATF country risk list is now editable in the UI (previously DB/seed-only per the
  `IMPLEMENTATION_PLAN.md` note that compliance "can update after each plenary" — there was no actual UI
  for that until now), plus the two `SystemSetting` rows (domestic country code, grey-list document
  requirement).
- Verified: `tsc` clean, `next build` succeeds (15 routes, +1 for `/settings`), 82/82 tests pass, a
  DB-level check confirmed the seeded single ADMIN account correctly trips the last-admin guard.

## 2026-07-13 — Sidebar collapsed to one KYC link + client self-service KYC creation

Follow-up clarification on the same day's feedback batch. See `IMPLEMENTATION_PLAN.md` §13.

- **Sidebar**: the "KYC" group previously listed up to 4 separate links (New Individual KYC, New
  Corporate KYC, Clients, Waiting List). Collapsed to a single "KYC" sidebar item per role — Individual
  and Corporate cases were already combined at the data layer (`listCases()` never filtered by type), so
  this was purely a navigation simplification. Front office's case-creation entry point moved to a "New
  KYC Case" button on the Clients list page (`/cases/new` already has the Individual/Corporate picker).
- **Client Portal scope expanded**: clients can now create and fill in their own Individual KYC from
  scratch (not just review/upload/sign a staff-entered one) — reuses the same wizard field components
  as the staff side, but the review step never shows the risk score/rating/factors or the risk-override
  control (compliance-internal, stays hidden). Submitting a self-authored form auto-stamps the e-signature
  (the client's own declaration checkbox IS their attestation — no redundant "type your name again" step).
- **When a case is Rejected or Returned, the client now sees the reviewer's notes** (not just the status
  badge), and can Edit & Resubmit directly in the portal when Returned — but only for cases they created
  themselves; a staff-created Returned case still routes back to front office to fix, unchanged.
- **Schema**: `KycCase.makerId` is now optional; added `clientMakerId` (mirrors the `Document.
  uploadedById`/`uploadedByClientId` XOR pattern already in place — exactly one maker FK is set).
  `sanitizeDraft()` moved out of the staff-only `'use server'` actions file into `src/lib/cases/
  sanitize.ts` so the client path can reuse it too.
- Verified: `tsc` clean, `next build` succeeds (14 routes, +1 for `/portal/cases/[id]/edit`), 82/82
  tests pass, and a DB-level integration script exercised the self-service flow end-to-end (create →
  visible on dashboard as DRAFT → ownership-scoped → submit auto-signs → return with notes → still
  editable → an unrelated staff-created DRAFT correctly stays hidden). No browser-automation tool was
  available this session to click through the actual UI — a manual pass is still recommended.

## 2026-07-13 — Client Portal (Module 3) + manager feedback batch

Manager's live-meeting notes, applied across both KYC wizards plus a new client-facing self-service
module. See `IMPLEMENTATION_PLAN.md` §12 for full detail.

- **New: Client Portal** — clients self-register (`ClientUser`, fully separate auth domain from staff
  `User`: own table, own JWT cookie `aml_client_session`, own `/portal/login` + `/portal/register`
  pages, gated independently in `middleware.ts`). Once logged in they see cases matched to them via
  `KycCase.clientEmail` (a deliberately plaintext column, populated automatically on save/submit,
  used only to link a case to a portal account), can review a read-only KYC summary (risk
  score/rating/factors deliberately excluded — compliance-internal, never shown to the client), upload
  supporting documents (`uploadClientDocument`, `Document.uploadedByClientId`), and electronically sign
  to attest the KYC is accurate (`signKycCase` → `KycCase.clientSignedAt`/`clientSignatureName`).
  Upload/sign are blocked once a case is DRAFT (not yet submitted) or APPROVED/REJECTED (closed).
  `AuditLog` gained a parallel `clientActorId` FK and `CLIENT_*` actions; the document download route
  now authorizes either a staff session or the matching client session.
- **Individual KYC wizard reordered**: Political Exposure (PEP) now comes before Work & Income (was
  after Beneficial Owner). Required-documents checklist + upload panel moved from step 1 to the final
  Review step.
- **Individual KYC fields added**: optional `workEmail`, required `preferredContact` (Work/Personal),
  `REAL_ESTATE` as a Source of Income option.
- **Real IBAN validation**: `bankIban` now checks a real ISO 7064 MOD 97-10 checksum (new
  `src/lib/iban.ts`, unit-tested against known-valid IBANs from multiple countries), not just length.
- **Corporate KYC wizard**: same documents-checklist-to-last-step move. `bank1AccountNo`/
  `bank2AccountNo` (dual-purpose "IBAN / Account Number" fields) get the same checksum check, but only
  when the value structurally looks like an IBAN — a plain account number is left unvalidated.
- **Sidebar consolidated**: the split "KYC Compliance" + "Compliance Officer" nav groups are now a
  single **KYC** group; case-list links renamed to **Clients**, review/approval-queue links renamed to
  **Waiting List**.
- Verified: `tsc` clean, `next build` succeeds (13 routes incl. 4 new `/portal/*` routes), 82/82 tests
  pass (13 new — IBAN validator + updated individual/corporate schema tests), a DB-level integration
  script confirmed the portal's case-matching/eligibility rules end-to-end (register → 0 cases → case
  submitted with matching email → 1 case visible → ownership-scoped lookup → status-gating) since no
  browser-automation tool was available in this session to click through the actual `/portal/*` UI —
  that manual pass is still recommended before shipping.

## 2026-07-13 — Sidebar recolored to a blue gradient

Sidebar was plain white; user asked for "bluish nice color." Rather than reverting to the earlier-rejected
all-dark theme, applied a common banking-admin-panel pattern: a colored navy-blue gradient sidebar rail
against the established white content workspace.

- New theme tokens in `globals.css`: `--color-sidebar-from`/`-to` (blue gradient, `#1e40af` → `#0b1638`),
  `--color-sidebar-active`/`-hover` (translucent white overlays for nav item states), `--color-sidebar-border`.
- `src/components/app-shell.tsx`: sidebar `<aside>` (desktop + mobile drawer) now `bg-gradient-to-b
  from-sidebar-from to-sidebar-to`; nav text switched to white/light-blue; active nav item gets a
  translucent white pill + a **gold** left accent bar (reusing the `accent` token, which was already
  reserved for brand-mark/premium touches — ties the active-state indicator back to the logo). Brand logo
  icon changed from flat primary-blue to a gold gradient so it doesn't disappear against the now-blue
  sidebar background. Top header and main content area are unchanged (still white/light).
- Verified: `tsc` clean, `next build` succeeds, 69/69 tests pass, browser screenshots confirm both the
  expanded and collapsed sidebar states render correctly with 0 console errors.

- **Font changed to Roboto** (+ Cairo for Arabic) — Google's own typeface (Android, Gmail, Material
  Design), per explicit request ("make it like google's"). Roboto only ships weights 400/500/700/900 (no
  600/800) — the codebase's `font-semibold`(600) usages fall back to the browser's nearest-weight match,
  which renders fine; the one `font-extrabold`(800) usage (StatCard numbers) was changed to `font-black`
  (900) so it maps to an actually-shipped weight file instead of relying on fallback.
- **Sidebar made bigger**: brand icon/title, group labels, and nav item text all bumped a step (nav items
  now `text-base font-semibold` up from `text-sm font-medium`), sidebar width `w-64`→`w-72` (collapsed
  `68px`→`76px`) to give the larger text room.
- **Corporate promoted to a first-class sidebar item** — previously it was only reachable by opening "New
  KYC Case" and picking a type inside the form. Front office now sees two distinct links: **New
  Individual KYC** and **New Corporate KYC**, the latter linking to `/cases/new?type=CORPORATE` which
  preselects Corporate on the form. Sidebar group label changed from "KYC — Individuals" to
  "KYC Compliance" since it now covers both client types.
- **Bug fixed while wiring the two links**: both hrefs share the pathname `/cases/new` (only the query
  string differs), so the sidebar's `usePathname()`-only active-state check couldn't tell them apart —
  both would highlight together. Added `useSearchParams()` and a proper `path`+`type` match so each link
  highlights independently; verified via browser automation that clicking "New Corporate KYC" highlights
  only itself and correctly preselects Corporate on the destination page.
- Verified: `tsc` clean, `next build` succeeds (confirms Roboto's weight list is valid — an invalid
  weight fails the build immediately), 69/69 tests pass, 0 console errors driving the flow in a real
  browser.

## 2026-07-13 — Typography scale-up + Corporate KPI dashboard section

- **Bigger, fuller typography app-wide**: root `html` font-size bumped 16px → 18px (cascades through every
  rem-based Tailwind size), body default weight bumped to 500, headings to 700, labels/table headers to
  600. Bumped explicit sizes on the most prominent elements: StatCard numbers (`text-2xl`→`text-3xl` +
  `font-extrabold`), Card titles (`text-base`→`text-lg` + bold), Button height/text (`h-10 text-sm` →
  `h-11 text-base`, `font-medium`→`font-semibold`), Input/Select/Textarea height and text size, Field
  labels to semibold.
- **Bug caught while editing**: an edit to `Textarea` in `src/components/ui/input.tsx` briefly dropped
  the forwarded `className` prop — fixed before it shipped.
- **Bug found via screenshot verification**: the larger type made `StatCard` labels truncate mid-word
  ("Pending Com…", "Corporate — …"). Fixed by removing the single-line `truncate` and letting labels wrap
  onto two lines instead — also shortened the new corporate KPI labels (dropped the redundant
  "Corporate — " prefix since the section header already says "Corporate Overview").
- **New dashboard section**: "Corporate Overview" — 4 KPI cards (Total Cases, Pending Compliance, High
  Risk, Approved) scoped to `clientType: CORPORATE`, mirroring the existing general stats row, respecting
  the same per-role scoping (front office sees their own corporate cases; compliance/manager/admin see
  all). `corporateStatsFor()` added alongside the existing `statsFor()` in `src/app/(app)/page.tsx`.
- Verified: `tsc` clean, `next build` succeeds, 69/69 tests pass, browser screenshots confirm no
  truncation and 0 console errors on the dashboard (both stat rows) and login page.

## 2026-07-13 — Module 2: Corporate KYC + font finalized (Public Sans)

User locked in the font (after three iterations) and provided the 25-page Corporate KYC paper form,
asking for it to be built as a second client type alongside Individual KYC, reusing the same
maker→checker→approver workflow, encryption, and FATF screening.

- **Font finalized: Public Sans** (+ Cairo for Arabic) — the US federal/gov typeface, chosen specifically
  for its form-field legibility. Applied in `src/app/layout.tsx` / `globals.css`. This is the fourth and
  intended-to-be-final font decision this project; do not change without being asked again.
- **Data model**: added `KycCase.clientType` (`INDIVIDUAL | CORPORATE`, default `INDIVIDUAL`) and a new
  `CorporateProfile` model (1:1 with `KycCase`, mirroring `KycProfile`'s encryption pattern — `...Enc`
  suffix = AES-256-GCM, `...Json` suffix = JSON-encoded array/object). Migration: `corporate_kyc`.
- **New document types**: `COMMERCIAL_LICENSE`, `MEMORANDUM_ARTICLES`, `BOARD_RESOLUTION`,
  `FINANCIAL_STATEMENTS`, `SHAREHOLDER_REGISTER` added to the shared `DOC_TYPES` union.
- **Risk engine extended** (`src/lib/risk/engine.ts`): added `assessCorporateRisk` alongside the existing
  `assessRisk`, sharing the country-exposure "worst country wins" logic via an extracted
  `scoreCountryExposure` helper. New corporate factors: self-disclosed FATF dealings (+50, forces HIGH —
  the strongest possible signal since the entity is disclosing it directly), high-risk business activity
  per FATF-recognized sectors — arms/precious metals/virtual currencies/gambling/real estate
  brokerage/etc. (+25), PEP link via 25%+ shareholders/signatories/managers (+50), dealing in securities
  without being a regulated/supervised entity (+10), director/major-shareholder-of-listed-company or
  10%+ institutional shareholder (+15), related party (+15), high turnover/wealth over corporate-scale
  thresholds — KD 1M turnover / KD 5M wealth, deliberately higher than the individual thresholds (+10).
- **Corporate KYC wizard**: 8 steps (Company Type & Documents, Company Details, Signatories & Structure,
  Regulatory/Activity/Communication, Financial & Investment, Bank Accounts, Beneficial Owner & Political
  Exposure, Categorization & Declaration), built in `src/components/corporate/` and
  `src/lib/cases/corporate-*.ts` — parallel file structure to the individual KYC module rather than
  branching one giant conditional codebase. Reuses all generic shared UI (CountrySelect, YesNoField,
  CheckboxRow, DocumentsPanel, FatfDialog, RiskPanel) unchanged.
- **Simplification vs. the paper form** (documented, not silently dropped): the paper form's five
  branching document checklists (by business type: Kuwaiti company / foreign company / investment fund
  / charitable org / government body) were collapsed into one general checklist (license, MOA/AoA,
  signatories list, board list, financial statements) to keep the wizard's first step tractable; the
  internal "§X — for institution use" verification section (docs reviewed, sanctions list checked) was
  **not** modeled as separate form fields — it's covered by the existing compliance decision/notes +
  audit trail, which already serves that purpose.
- **New Case flow**: `/cases/new` now has an Individual/Corporate client-type selector; `createCase`
  branches which profile (`KycProfile` vs `CorporateProfile`) to create. Edit and detail pages branch by
  `kase.clientType` to render the correct wizard/summary. Case list and dashboard "recent cases" now
  surface `corporateProfile.legalName` as the client name for corporate rows.
- **Tests**: 23 new tests (corporate risk engine factors + corporate schema validation conditionals) —
  69/69 total passing. `tsc` clean, `next build` succeeds (2 pre-existing unused-var lint warnings fixed).

## 2026-07-13 — Theme redesign: banking premium (light, data-forward)

User rejected the two prior visual directions (navy/gold ERP, dark "cinema" dashboard) as looking like a
generic SaaS "showroom," not a professional KYC/AML compliance system. Requested: white, professional
charts, banking premium. Rebuilt the entire visual layer:

- **Palette**: light institutional banking (`src/app/globals.css`) — white cards on a pale slate-blue
  canvas (`#F8FAFC`), deep royal-blue primary (`#1E3A8A`) for all interactive elements, restrained gold
  (`#A16207`) reserved for the brand mark only (never used for functional/selected states — that was a
  bug in the prior gold-accent theme, fixed here). Palette chosen from the design skill's "Banking/Traditional
  Finance" reference (navy + gold, WCAG-adjusted).
- **Font**: IBM Plex Sans (the skill's "Financial Trust" pairing — banks/insurance/enterprise, built for
  data) + Cairo for Arabic RTL. Replaced the previous Plus Jakarta Sans / Space Grotesk experiments.
- **Real charts added to the dashboard** (`src/components/charts/dashboard-charts.tsx`, recharts): a
  14-day case volume trend (line), risk distribution (bar, red/amber/green severity colors with direct
  value labels), and case status breakdown (horizontal bar + legend). Colors were run through the dataviz
  skill's `validate_palette.js` six-check validator for light mode (lightness band, chroma floor, CVD
  separation, contrast) before use; the one WARN (risk severity contrast) is satisfied by the now-mandatory
  direct value labels on every bar.
- **Rebuilt every UI primitive and page** for the light theme: Button, Input, Card, Badge, Table, Alert,
  Dialog, Field, StatCard, app shell (white sidebar, navy active-state), login (dark navy brand panel +
  white sign-in card split screen), and all KYC wizard components (steps, risk panel, case summary,
  documents panel, audit timeline, FATF dialog).
- **Bug fixed while reverting**: several components used the gold accent color for interactive
  "selected" states (Yes/No toggles, checkboxes, form-type picker, wizard stepper) — gold is reserved
  for the brand mark only per the new design system, so these were switched to the functional navy
  primary color.
- **Bug fixed**: the case-volume trend chart's Y-axis ticks were non-monotonic (recharts' auto tick
  generation misbehaves on small integer ranges) — replaced with explicit, JS-computed ascending integer
  ticks.
- Verified: `tsc` clean, `next build` succeeds, 46/46 Vitest tests pass, 0 browser console errors across
  login/dashboard/cases/wizard, screenshots reviewed for both compliance-officer and front-office roles.

## 2026-07-08

- **Project kickoff.** Decisions made with user: Next.js 15 + PostgreSQL stack; full bilingual EN/AR with RTL; email/password auth with 3 roles (FRONT_OFFICE, COMPLIANCE_OFFICER, SENIOR_MANAGER) + ADMIN; risk rating = auto-score with upward-only maker override.
- **Researched FATF lists (June 2026 plenary):** black list = Iran, North Korea, Myanmar; grey list = 22 jurisdictions incl. Kuwait. Stored in DB, not code. Added `domesticCountryCode` setting (default KW) to exempt domestic clients from the grey-list document requirement.
- Created `IMPLEMENTATION_PLAN.md` (full architecture, data model, risk engine spec, workflow state machine, task list) and this `CHANGELOG.md`.

### Build (Module 1 complete)

- **DB switched to SQLite for local dev** (Docker/Postgres too heavy for the user's laptop). Prisma schema stays provider-agnostic; PostgreSQL migration path documented in the README. Prisma pinned to v6 (v7 dropped `url` in schema).
- **Data layer** (`prisma/schema.prisma`): User, Country (FATF status), KycCase, KycProfile (1:1, PII columns encrypted), Document, AuditLog, SystemSetting, CaseCounter. First migration applied.
- **Encryption** (`src/lib/crypto.ts`): AES-256-GCM field + buffer helpers (unique IV, auth tag, `:`-delimited format), SHA-256, bcrypt password hashing.
- **Seed** (`prisma/seed.ts`): ~243 countries with EN/AR names (`Intl.DisplayNames`) + FATF flags (3 black, 22 grey), 4 demo users, system settings.
- **Risk engine** (`src/lib/risk/engine.ts`): weighted scoring → LOW/MEDIUM/HIGH, worst-country rule, domestic exemption, source-of-funds trigger, upward-only override resolution. Pure + unit-tested.
- **Workflow** (`src/lib/workflow.ts`): state machine with role guards; HIGH-risk compliance-approve escalates to manager. Pure + unit-tested.
- **i18n** (`src/lib/i18n`): EN/AR dictionaries (Arabic labels from the paper form), locale cookie, server + client providers, RTL via `dir` + logical CSS.
- **Auth** (`src/lib/auth`, `src/middleware.ts`): login/logout server actions, JWT sessions (jose, httpOnly, 8h), login rate-limiting, RBAC middleware + per-page `requireSession(roles)`.
- **UI kit** (`src/components/ui`): Button, Input/Select/Textarea, Field, Card, Badge, Dialog (native `<dialog>`), Table, Alert — Swiss/minimal enterprise style, IBM Plex Sans + Arabic.
- **KYC wizard** (`src/components/kyc`): 7-step form (case+docs, personal, work+bank, beneficial owner, PEP, related parties, review+declaration), react-hook-form + zod, per-step validation, debounced autosave, live risk sidebar, **FATF popup** requiring encrypted source-of-funds upload.
- **Case flow** (`src/app/(app)`): dashboard (role-aware stats), my/all cases, review queue, approvals queue, case detail (decrypted read-only summary + decision panel + documents + audit timeline). Encrypted document upload/download API route.
- **Security**: CSP + hardening headers in `next.config.ts`; `poweredByHeader` off.
- **Tests**: 46 Vitest unit tests (risk, workflow, crypto, schemas) — all pass. `tsc --noEmit` clean. `next build` succeeds.
- **Verification**: 16-check workflow integration test against the real DB (create→submit→compliance-escalate→manager-approve, HIGH-risk path, encryption-at-rest, audit trail) — all pass. 8-check auth-primitive test (bcrypt vs seeded hash, JWT round-trip/tamper) — all pass. HTTP smoke test (unauth redirects, RBAC, headers, public login) — pass. Login page verified rendering in EN (LTR) and AR (`dir="rtl"`).

**Module 1 (Individual KYC) is complete and verified.** Next phases (future): Corporate KYC, sanctions/name screening, transaction monitoring, STR/SAR reporting.

### UI redesign + bug fixes (after visual review)

- **Rebuilt the app shell into a proper ERP layout** (`src/components/app-shell.tsx`): the sidebar was previously `hidden lg:flex` (invisible on most screens) — now it's a **persistent dark sidebar** with grouped nav sections, collapsible to an icon rail (preference persisted in localStorage) and a slide-over drawer on mobile. Added a refined top bar with breadcrumb + language toggle + **user dropdown menu** (avatar initials, logout).
- **Design system polish** (`globals.css`): card/raised/pop shadow tokens, primary-soft + sidebar color tokens, thin custom scrollbars, subtle fade-in. Cards → `rounded-xl` + `shadow-card`. New **StatCard** with colored icon tiles on the dashboard. Redesigned **login** into a premium split-screen (dark brand panel with gradient + feature list, clean form card).
- **Verified visually with Playwright screenshots** (login, dashboards for each role, cases list, KYC wizard, FATF popup) at 1440×900.
- **Bug fixed — new-case creation was 500'ing.** `createCase` rejected the default "New Client" form because the unrendered `clientNo` field came back as `null` (schema accepted string/undefined/'' but not null). Now normalized to `''`. New cases create correctly.
- **Bug fixed — FATF popup fired spuriously for domestic Kuwait.** The wizard built its own country-exposure list that included domestically-exempt Kuwait, so every new case (default KW residence/bank) triggered the "high-risk country" popup even though the risk engine correctly scored it 0. The wizard now derives flags from the engine's `flaggedCountries` (exemption-aware). Verified: **no** popup for Kuwait, popup **does** fire for Iran (+50, HIGH). 0 console errors across the flow.
- **Fixed sidebar active-state double-highlight** (`/cases/new` also lit `/cases`): now longest-prefix match wins. Fixed collapse-toggle wording and gave the login feature list distinct copy.
- 46 Vitest tests still pass · `tsc` clean · `next build` succeeds.

### Theme refresh — "Private Banking" (navy + gold)

- User chose the navy + gold direction. **Font changed** from IBM Plex Sans to **Plus Jakarta Sans** (Latin) + **Cairo** (Arabic RTL companion) in `layout.tsx`. This also resolved the faint sidebar-brand title (it was IBM Plex FOUT).
- **Color tokens** (`globals.css`): primary → royal blue `#1E40AF`, new **gold accent** `#B4881F` (+ hover/soft), warm off-white canvas `#F6F5F2`, ink text `#0B1220`, deeper navy sidebar with `sidebar-accent` hover. Shadows retuned to the ink hue.
- **Gold touches**: gradient gold brand shield (sidebar + login), gold-tinted icon on the active nav item, gold-ringed feature tiles + blue→gold gradient on the login brand panel.
- Verified with fresh screenshots (login + dashboard). `tsc` clean · `next build` succeeds.

### Bug fix — case detail runtime error

- The case detail page (a Server Component) passed `onChange={() => {}}` to the client `DocumentsPanel`, which threw *"Event handlers cannot be passed to Client Component props."* Made `onChange` **optional** in `DocumentsPanel` (guarded the two call sites with `?.`) and removed the empty handler from the read-only usage. Verified by opening a real case detail in a browser: renders cleanly, decrypted data + risk card + audit timeline all show, **0 console/page errors**.
