# AML System — Implementation Plan

> **Module 1: KYC (Individuals)** — maker/checker/approver workflow with FATF country screening. **Status: Complete.**
> **Module 2: KYC (Corporate)** — same workflow, corporate-specific fields & risk factors. Started: 2026-07-13 · **Status: Complete.**
> **Module 3: Client Portal** — self-service account for clients to review/upload/sign their own KYC. Started: 2026-07-13 · **Status: Complete.** See §12.
> **Module 4: Full AML Platform** — Settings/RBAC, Sanctions/PEP Screening, Ongoing Risk Assessment (CRA),
> Transaction Monitoring/Rules/Alerts, Case Management/STR Reports, Reports & Analytics. Started:
> 2026-07-15 · **Status: Complete.** See §14.
> Every change made to the codebase is logged in [CHANGELOG.md](./CHANGELOG.md).

---

## 1. Vision

A full AML platform. This phase delivers the first section: **KYC for Individual clients**, generic
(no company branding), bilingual (English/Arabic with RTL), with a 3-stage approval workflow:

| Stage | Role | Action |
|---|---|---|
| 1 — Maker | Front-line employee (`FRONT_OFFICE`) | Fills the KYC form from the client interview, sees auto-computed risk rating, may override it **upward** with mandatory justification, submits. |
| 2 — Checker | Compliance officer (`COMPLIANCE_OFFICER`) | Reviews the case: **Approve**, **Reject**, or **Return for correction**. If final risk = HIGH, "Approve" escalates to stage 3 instead of finalizing. |
| 3 — Approver | Senior manager (`SENIOR_MANAGER`) | Final **Approve** / **Reject** for HIGH-risk cases only. |

Future phases (not in scope today): Corporate KYC, sanctions/name screening, transaction
monitoring, STR/SAR reporting, periodic KYC review scheduling.

## 2. Tech stack (decided with user, 2026-07-08)

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15 (App Router) + TypeScript** | One codebase for UI + API, server actions, fastest path; machine has Node 24. |
| UI | **Tailwind CSS v4 + shadcn/ui-style components + lucide-react** | Professional enterprise UI, full RTL support via logical properties. |
| Fonts | **Public Sans + Cairo (Arabic)** | US federal/gov typeface purpose-built for dense forms; finalized 2026-07-13 after iterating through IBM Plex Sans, Plus Jakarta Sans, and Space Grotesk/Inter — do not change again without being asked. |
| DB | **PostgreSQL 16 (Docker)** | Robust, scales for the full AML platform. |
| ORM | **Prisma** | Type-safe schema + migrations. |
| Forms | **react-hook-form + zod** | Per-step validation, shared client/server schemas. |
| Auth | **Email/password (bcryptjs) + JWT session (jose) in httpOnly cookie** | Self-contained; AD/SSO can be added later. |
| i18n | **Lightweight dictionary-based EN/AR, cookie locale, `dir=rtl`** | Full bilingual UI without routing complexity. |
| Tests | **Vitest** | Unit tests for risk engine, workflow, crypto, validation. |

### Encryption ("fully encrypted")
- **Passwords**: bcrypt (cost 12).
- **Sensitive PII columns** (Civil ID, passport no., account no., IBAN, phone, address, DOB…):
  application-level **AES-256-GCM** (unique IV per value, auth tag verified) via `ENCRYPTION_KEY` env var (32 bytes).
- **Uploaded documents**: encrypted at rest with AES-256-GCM before writing to disk; decrypted only on authorized download.
- **In transit**: TLS terminates at the reverse proxy in production (out of scope for local dev).
- **Sessions**: signed JWT (HS256), httpOnly, SameSite=Lax, 8h expiry.
- Searchable non-sensitive fields (name, nationality, status) stay plaintext so queues/search work.

## 3. FATF country screening (researched 2026-07-08, June 2026 plenary)

- **Black list (Call for Action)**: Iran, North Korea, Myanmar → always **HIGH** country risk, mandatory source-of-funds document.
- **Grey list (Increased Monitoring, 22 jurisdictions)**: Angola, Bolivia, Bosnia & Herzegovina, Bulgaria,
  Cameroon, Côte d'Ivoire, DR Congo, Haiti, Iraq, Kenya, **Kuwait**, Laos, Lebanon, Monaco, Nepal,
  Papua New Guinea, South Sudan, Syria, Venezuela, Vietnam, Virgin Islands (UK), Yemen.
- Lists are **stored in the DB** (`Country.fatfStatus`) so compliance can update them after each plenary — no code change needed.
- **Kuwait nuance**: Kuwait itself is grey-listed. To avoid flagging every domestic client, a
  `domesticCountryCode` system setting (default `KW`) exempts the domestic country from the grey-list
  document requirement. Black-list countries are never exempt. Configurable per deployment.
- **Trigger fields**: nationality, other nationalities, country of birth, residency country, current residence country, work country, bank account country.
- **Behavior**: when a trigger field matches a listed country → modal popup explains the risk and requires
  upload of a **source-of-funds supporting document** before the form can be submitted; country risk points feed the risk engine.

## 4. Risk rating engine

Weighted scoring → **LOW / MEDIUM / HIGH** with a visible per-factor breakdown:

| Factor | Signal | Points |
|---|---|---|
| Country (max across all trigger fields) | FATF black list | +50 (forces HIGH) |
| | FATF grey list (non-exempt) | +25 |
| PEP | Client/beneficial owner is PEP | +50 (forces HIGH) |
| | PEP relative/associate (2nd degree) | +30 |
| Beneficial owner | Account managed by another person | +15 |
| Employment | Unemployed / no clear income | +15 |
| | Self-employed | +10 |
| Source of income | Trade/business or "Other" | +10 |
| | Inheritance | +5 |
| Wealth/income | Annual income > 100k KD or wealth > 1M KD | +10 |
| Related party | Related to company / has control / board member | +15 |
| Documents | Missing optional supporting docs | +5 |

Rating: `HIGH ≥ 50`, `MEDIUM ≥ 25`, else `LOW`. Maker may **increase** the rating (never decrease)
with a mandatory justification; final rating = max(system, maker). All thresholds live in one module
(`src/lib/risk/engine.ts`) with unit tests.

## 5. Data model (Prisma, summary)

- **User** — email, passwordHash, nameEn/nameAr, role (`FRONT_OFFICE | COMPLIANCE_OFFICER | SENIOR_MANAGER | ADMIN`), active.
- **Country** — ISO code, nameEn, nameAr, fatfStatus (`NONE | GREY | BLACK`), active.
- **KycCase** — caseNumber (`KYC-YYYY-NNNNN`), formType (`NEW_CLIENT | KYC_UPDATE`), status
  (`DRAFT | PENDING_COMPLIANCE | RETURNED | PENDING_MANAGER | APPROVED | REJECTED`), maker/checker/approver refs,
  decisions + notes + timestamps, risk fields (systemScore, systemRating, finalRating, overrideJustification, factor breakdown JSON).
- **KycProfile** (1:1 with case) — all form sections; sensitive columns encrypted:
  - §2.1 Personal: title, fullName, dob*, nationality, otherNationalities, countryOfBirth, otherResidencyCountry, civilIdNo*, civilIdExpiry, passportNo*, passportExpiry, residence (country/city/address*), mobile*, tel*, email*
  - §2.2 Work: employmentStatus, employer, sector, jobTitle, workAddress, workPhone, yearsOfWork, selfEmploymentDetails, sourcesOfIncome[], otherIncomeDetail, annualIncomeKd, approxWealthKd
  - §2.2b Default bank account: beneficiaryName, bankName, branch, country, accountNo*, iban*, swift, currency
  - §3 Beneficial owner: isManagedByOther, managerType (`POA | GUARDIAN | OTHER`), authorized person (name, nationality, civilId*, passport*, address*, relation)
  - §4 PEP: isPep, pepPositions[], hasPepRelative, pepName, pepRelationship, pepPositionDetails
  - §6 Related parties: isRelatedParty, party names/relations, hasControl, isBoardMember
  - §1 Document checklist: which required docs were sighted/attached
  - §7 Declarations: agreement checkbox + maker attestation
  (* = AES-256-GCM encrypted at rest)
- **Document** — case ref, docType (`CIVIL_ID | PASSPORT | SALARY_CERT | POA | COURT_ORDER | SOURCE_OF_FUNDS | OTHER`), original name, mime, size, encrypted path, sha256, uploadedBy.
- **AuditLog** — case ref (nullable for auth events), actor, action, fromStatus/toStatus, details JSON, IP, timestamp. Append-only.
- **SystemSetting** — key/value (e.g. `domesticCountryCode=KW`, `greyListRequiresDocument=true`).

## 6. Workflow state machine

```
DRAFT ──submit──▶ PENDING_COMPLIANCE ──approve (final risk LOW/MED)──▶ APPROVED
  ▲                    │ │ │
  │                    │ │ └─approve (final risk HIGH)──▶ PENDING_MANAGER ──approve──▶ APPROVED
  └──edit & resubmit── │ └─return-for-correction──▶ RETURNED ──resubmit──▶ PENDING_COMPLIANCE
                       └─reject──▶ REJECTED            (manager may also reject──▶ REJECTED)
```
Guards: only the maker edits DRAFT/RETURNED; only compliance decides PENDING_COMPLIANCE; only senior
manager decides PENDING_MANAGER; every transition writes an AuditLog row. Enforced in one module
(`src/lib/workflow.ts`) with unit tests.

## 7. UI design system

- **Style**: banking premium — light institutional theme (white cards, pale slate-blue canvas `#F8FAFC`),
  deep royal-blue primary `#1E3A8A` for all interactive elements, gold `#A16207` reserved strictly for
  the brand mark (never for functional/selected states — that was a bug in an earlier iteration, fixed).
  Risk badges: green/amber/red with icons (never color alone). Finalized 2026-07-13 after two rejected
  directions (navy/gold ERP "showroom" look, then a dark "cinema" dashboard) — user wanted white,
  professional, chart-forward.
- **Typography**: Public Sans (LTR) / Cairo (RTL), base 16px.
- **Charts**: recharts on the dashboard (case volume trend, risk distribution, status breakdown),
  colors validated with the dataviz skill's six-check accessibility validator.
- **Layout**: sidebar app shell (collapses on mobile), role-filtered navigation, language toggle EN/عربي in header.
- **KYC form**: multi-step wizard with progress stepper (7 steps = form sections), inline validation on blur, autosave draft, review summary step before submit.
- **Queues**: table with status/risk badges, search, filters. **Case detail**: read-only sections + decision panel + audit timeline.
- A11y: labels on all fields, 4.5:1 contrast, keyboard navigable, focus rings, `dir`-aware logical spacing.

## 8. Engineering tasks

| # | Task | Status |
|---|---|---|
| 0 | Implementation plan + changelog docs | ✅ |
| 1 | Scaffold Next.js 15 + TS + Tailwind + deps | ✅ |
| 2 | Prisma schema + first migration (SQLite dev; Postgres path documented) | ✅ |
| 3 | Crypto module: AES-256-GCM helpers + bcrypt hashing | ✅ |
| 4 | Seed: ~243 countries (EN/AR names, FATF flags), 4 demo users, settings | ✅ |
| 5 | Auth: login page, session issue/verify, RBAC middleware + route guards | ✅ |
| 6 | i18n: EN/AR dictionaries, locale cookie, RTL switching, language toggle | ✅ |
| 7 | Risk engine + FATF screening logic (pure, unit-tested) | ✅ |
| 8 | KYC form wizard: 7 steps, zod schemas, autosave, review summary | ✅ |
| 9 | FATF popup + encrypted document upload/download | ✅ |
| 10 | Workflow transitions + server actions (submit/approve/reject/return) | ✅ |
| 11 | Dashboards + queues + case detail with decision panel | ✅ |
| 12 | Audit trail: write on every transition, timeline UI | ✅ |
| 13 | Hardening: login rate limit, security headers, session expiry | ✅ |
| 14 | Vitest suite: risk engine, workflow, crypto, schemas (46 tests) | ✅ |
| 15 | End-to-end verification + README | ✅ |

> **Note (2026-07-08):** local DB is SQLite, not Docker/Postgres — Docker was too heavy for the
> user's laptop. Encryption is application-layer (AES-256-GCM) so data is fully encrypted regardless
> of DB engine. PostgreSQL is a one-line provider change (see README).

## 9. Demo accounts (seeded, local dev only)

| Role | Email | Password |
|---|---|---|
| Front office (maker) | employee@aml.local | Employee@123 |
| Compliance officer | compliance@aml.local | Compliance@123 |
| Senior manager | manager@aml.local | Manager@123 |
| Admin | admin@aml.local | Admin@123 |

## 10. Module 2: Corporate KYC (2026-07-13)

Same maker→checker→approver workflow, same encryption/FATF/audit infrastructure, applied to a second
client type. Built as parallel files (`corporate-schemas.ts`, `corporate-mappers.ts`,
`corporate-actions.ts`, `corporate-display.ts`, `src/components/corporate/*`) rather than branching one
shared codebase — keeps each client type's business rules independently readable.

**Data model**: `KycCase.clientType` (`INDIVIDUAL | CORPORATE`) decides which profile relation is
populated — `KycProfile` (existing) or the new `CorporateProfile` (1:1, same `...Enc`/`...Json`
encryption convention). New doc types: `COMMERCIAL_LICENSE`, `MEMORANDUM_ARTICLES`,
`BOARD_RESOLUTION`, `FINANCIAL_STATEMENTS`, `SHAREHOLDER_REGISTER`.

**Corporate risk factors** (`assessCorporateRisk`, shares country-exposure scoring with the individual
engine via an extracted `scoreCountryExposure` helper):

| Factor | Signal | Points |
|---|---|---|
| Country (incorporation/tax residence/bank/subsidiary countries) | FATF black list | +50 (forces HIGH) |
| | FATF grey list (non-exempt) | +25 |
| FATF dealings | Entity self-discloses dealings in a FATF call-for-action/monitored jurisdiction | +50 (forces HIGH) |
| PEP | 25%+ shareholder/signatory/manager (or 2nd-degree relative) is a PEP | +50 (forces HIGH) |
| Business activity | Recognized higher-risk sector (arms, precious metals, virtual currencies, gambling, real estate brokerage, etc.) | +25 |
| Regulatory status | Deals in securities but is not a regulated/supervised entity | +10 |
| Company control link | Director/major shareholder of a listed company, or 10%+ shareholder of the institution | +15 |
| Related party | Client considered a related party to the institution | +15 |
| Financials | Annual turnover > KD 1M or wealth > KD 5M (corporate-scale thresholds, higher than individual) | +10 |

Same `HIGH ≥ 50 / MEDIUM ≥ 25` bands and upward-only maker override as Module 1.

**Wizard**: 8 steps — Company Type & Documents, Company Details, Signatories & Structure (authorized
signatories / board / executive management / subsidiaries — all dynamic lists), Regulatory/Activity &
Communication, Financial & Investment Information, Bank Accounts (two accounts), Beneficial Owner &
Political Exposure & Controlling Persons, Categorization & Declaration.

**Deliberate simplifications vs. the paper form** (scope decisions, not oversights):
- The paper form's five branching document checklists (by business type: Kuwaiti company / foreign
  company / investment fund / charitable org / government body) were collapsed into **one general
  checklist** to keep step 1 tractable. Revisit if compliance needs the branching version.
- The paper form's final "for institution use" section (docs reviewed, sanctions list checked) was
  **not** built as separate form fields — the existing compliance decision + notes + audit trail already
  covers that verification step.

**Entry point**: `/cases/new` gained an Individual/Corporate selector; `createCase` branches which
profile to create; edit/detail pages branch on `kase.clientType`.

## 12. Manager feedback batch + Client Portal (2026-07-13)

A batch of feedback from a live meeting, applied across both KYC modules plus a new module:

**Individual KYC wizard**:
- Reordered steps: Political Exposure (PEP) now comes *before* Work & Income (was after Beneficial
  Owner). New order: Case Info → Personal → PEP → Work & Income → Beneficial Owner → Related Parties →
  Review/Documents/Declaration.
- Moved the required-documents checklist + upload panel from step 1 to the final (Review) step, so
  clients/makers see the summary and required docs together at the end.
- Work & Income: added optional `workEmail` and a required `preferredContact` (Work/Personal) choice.
- Added `REAL_ESTATE` as a Source of Income option.
- `bankIban` now enforces a real ISO 7064 MOD 97-10 checksum (`src/lib/iban.ts`), not just a length check.

**Corporate KYC wizard**: same document-checklist-to-last-step move (step 1 "Company Type & Documents"
→ "Company Type"; step 8 "Categorization & Declaration" → "Documents, Categorization & Declaration").
`bank1AccountNo`/`bank2AccountNo` are dual-purpose "IBAN / Account Number" fields, so the IBAN checksum
is applied *only* when the value structurally looks like an IBAN (`looksLikeIban()`) — a plain account
number is left unchecked.

**Sidebar navigation**: consolidated the previously-split "KYC Compliance" + "Compliance Officer" nav
groups into a single **KYC** group; case-list links renamed to **Clients**, review/approval-queue links
renamed to **Waiting List**.

### Client Portal (Module 3)

Clients get a self-service account — separate from staff — to review their own KYC, upload supporting
documents, and electronically attest it's accurate. Scope decided via clarifying questions rather than
guessed: **self-service `ClientUser` accounts** (not a magic-link/invite model), and **review + upload +
sign only** — no editing of compliance-entered fields.

**Auth boundary**: `ClientUser` is a fully separate trust domain from staff `User` — own table, own JWT
session (`aml_client_session` cookie, distinct signing subject, `src/lib/auth/client-session.ts`), own
login/register pages under `/portal/login` and `/portal/register`, gated in `middleware.ts` independently
of the staff `aml_session` check. A client can never authenticate as staff or vice versa.

**Case matching**: `KycCase.clientEmail` is a deliberately **plaintext** column (unlike the `...Enc`
fields) that exists solely to match a submitted case to a portal account by email — searchable-encryption
wasn't worth the complexity for this, and it's treated as lower-sensitivity than civil ID/IBAN/etc.,
similar to how staff `User.email` is already plaintext. Populated automatically whenever a case is saved
or submitted (`src/lib/cases/actions.ts`, `corporate-actions.ts`). DRAFT cases are excluded from the
client's dashboard — front office hasn't submitted them yet.

**Capabilities**: read-only KYC display (`PortalCaseSummary` — deliberately omits the risk score/rating/
factors panel; that's compliance-internal and must never be disclosed to the client being assessed),
document upload (`uploadClientDocument`, `Document.uploadedByClientId`), and e-signature
(`signKycCase` sets `KycCase.clientSignedAt`/`clientSignatureName`). Upload/sign are blocked once a case
is `DRAFT` (not yet submitted) or `APPROVED`/`REJECTED` (closed) — see
`CASE_STATUSES_CLOSED_TO_CLIENT` in `src/lib/constants.ts`.

**Shared infrastructure reused as-is**: `AuditLog` gained an optional `clientActorId` FK (parallel to
`actorId`) and new `CLIENT_REGISTERED/CLIENT_LOGIN_SUCCESS/CLIENT_LOGIN_FAILED/CLIENT_LOGOUT/
CLIENT_DOC_UPLOADED/CLIENT_SIGNED` actions; `Document.uploadedById` became optional with a parallel
optional `uploadedByClientId` (exactly one of the two is set — enforced at the application level, not a
DB constraint); the document download API route (`/api/documents/[id]`) now authorizes either a staff
session (maker/reviewer) or a client session whose email matches the case's `clientEmail`.

**Files**: `src/lib/auth/client-session.ts`, `src/lib/portal/{actions,queries}.ts`,
`src/app/portal/{login,register}/*`, `src/app/portal/(portal)/{layout,page}.tsx`,
`src/app/portal/(portal)/cases/[id]/*`, `src/components/portal/*`.

## 13. Sidebar consolidation + client self-service KYC creation (2026-07-13, follow-up)

Two more rounds of feedback on the same day, both clarifying/extending §12:

**Sidebar**: "combined Individual + Corporate" already existed at the *data* layer
(`listCases()` never filtered by `clientType`) — what was still wrong was the *navigation*: multiple
separate links (New Individual KYC / New Corporate KYC / Clients / Waiting List). Collapsed to exactly
**one** sidebar item labeled "KYC" per role (`/cases` for front office/admin, `/review` for compliance,
`/approvals` for senior manager). Front office's case-creation entry point moved from the sidebar to a
"New KYC Case" button on the Clients list page itself — `/cases/new` already had an Individual/Corporate
picker built in, so nothing else needed to change there.

**Client self-service KYC creation**: the portal's scope grew from "review a staff-entered KYC, upload,
sign" to **the client can also create and fill in their own Individual KYC from scratch** (Corporate
self-fill stayed staff-only per an explicit scope decision — smaller surface to ship first). And when
compliance/manager rejects or returns a case, the client now sees the reviewer's notes (not just the
status badge) and, if Returned, can edit and resubmit directly in the portal.

- **Schema**: `KycCase.makerId` became optional (`String?`); added `clientMakerId String?` +
  `ClientUser.casesCreated` relation — mirrors the `Document.uploadedById`/`uploadedByClientId` XOR
  pattern already established (exactly one of `makerId`/`clientMakerId` is set, enforced at the
  application level). `sanitizeDraft()` was extracted out of `src/lib/cases/actions.ts` into
  `src/lib/cases/sanitize.ts` so both the staff and client save/submit paths can share it (a `'use
  server'` file may only export async functions, so the private synchronous helper couldn't stay there).
- **Ownership model**: a case is "owned" by a portal account two different ways — `clientMakerId`
  (self-created) or `clientEmail` match (staff-created, the original §12 flow). Reading/uploading/
  signing accepts either; **editing requires the strict `clientMakerId` check only** — a client must
  never gain edit rights over a staff-entered case just because an email happens to coincide.
- **DRAFT means something different depending on origin**: for a self-created case, DRAFT is the
  client's own in-progress form (fully theirs to edit/upload against); for a staff-created case, DRAFT
  means front office hasn't submitted it yet (nothing for the client to do). The portal dashboard,
  upload eligibility (`clientCanActOnCase()` in `src/lib/portal/actions.ts`), and the case-detail page's
  DRAFT handling all branch on origin, not just status.
- **No separate "type your name to sign" step for self-created cases**: the wizard's declaration
  checkbox is already the client's own first-person attestation (they typed the whole form and ticked it
  themselves), so `submitClientCase()` auto-stamps `clientSignedAt`/`clientSignatureName` from the
  portal account's own name at submit time. `SignPanel` still renders — it just always shows the
  "already signed" state for these cases, no interactive form. The interactive signature step
  (`SignPanel`'s form) remains meaningful only for the original staff-created flow, where the client
  didn't type the data themselves.
- **Client-facing wizard never shows risk data**: `PortalKycWizard`/`PortalStepReview` (parallel to
  `KycWizard`/`StepReview`, not a conditional branch in the staff-only components) reuse the same
  step field components (`StepCase`, `StepPersonal`, `StepPep`, `StepWork`, `StepBeneficialOwner`,
  `StepRelatedParties`) but the review step omits the risk score/rating/factors panel and the maker
  risk-override control entirely — both stay compliance-internal. The risk engine still runs
  server-side to gate the FATF source-of-funds popup (`PortalFatfDialog`) and required-document checks;
  it's just never rendered to the client. `PortalDocumentsPanel` gained the same `fixedDocType` prop as
  the staff panel to support that dialog.
- **Reviewer notes**: the case-detail page now shows `complianceNotes` (Returned) or
  `managerNotes`/`complianceNotes` (Rejected, whichever decision actually rejected it) in an `Alert`,
  plus an "Edit & Resubmit" button for self-created Returned cases only (staff-created Returned cases
  still go back to front office to fix, matching the original workflow).

**Files**: `src/lib/cases/sanitize.ts` (new), `src/lib/portal/actions.ts` (createClientCase/
saveClientCaseDraft/submitClientCase), `src/lib/portal/queries.ts` (ownership matching),
`src/app/portal/(portal)/cases/[id]/edit/page.tsx` (new), `src/components/portal/portal-kyc-wizard.tsx`,
`portal-step-review.tsx`, `portal-fatf-dialog.tsx` (new).

## 14. Module 4: Full AML Platform (2026-07-15/16)

User asked to bring this system to parity with a broader reference AML compliance platform
(screenshots: sanctions screening, transaction monitoring, case management, STR reporting, analytics —
see [[List Screening], [Sanctions Lists], [Risk Assessment], [Transaction Monitoring], [Alerts],
[Screening Rules Sandbox], [Cases], [STR Reports], [Reports & Analytics], [Settings]). Given the size,
agreed with the user to build it out one module at a time rather than all at once — six phases, each
independently verified (`tsc`, `next build`, `vitest`, plus a DB-level integration script per phase since
no browser-automation tool was available in this session).

**Phase 1 — Settings** (`src/lib/settings/`, `/settings`): Users & Permissions (first write path onto
`User` — create/role-change/activate-deactivate, guarded against removing the last active ADMIN), a
cross-case Audit Log viewer (previously `AuditLog` was only ever shown scoped to one KYC case), Security
(real password change; 2FA marked not-yet-available rather than faked), Lists & Data (FATF country list
+ system settings — previously DB/seed-only). SSO/API Integrations/Notifications/Form Customization are
explicit "Coming Soon" stubs.

**Phase 2 — Sanctions/PEP Screening** (`src/lib/screening/`, `/screening`, `/sanctions-lists`): hand-rolled
Jaro-Winkler + token-set fuzzy matcher (`similarity.ts`, no NLP dependency), an honest "Arabic
Normalization" toggle (letter-form unification + tashkeel stripping — real, but not full phonetic
transliteration, which has no free/maintained library). New `SanctionedEntity` model seeded with a real
snapshot (not fabricated) from the free, no-registration OFAC SDN and UN Consolidated List public XML
feeds. `src/lib/screening/lists.ts` tracks six list sources honestly: OFAC/UN = Loaded (real data);
EU/UK = Linking (real free feeds, registration step not built); PEP Worldwide/Adverse Media = Unavailable
(no free source exists anywhere — real vendors are paid feeds like Refinitiv/Dow Jones/ComplyAdvantage).

**Phase 3 — Ongoing Risk Assessment / CRA** (`src/lib/risk/cra*.ts`, `/risk-assessment`): periodic
re-scoring of APPROVED clients using CURRENT profile data, reusing `assessRisk`/`assessCorporateRisk`
unchanged (same weights as onboarding — one source of truth) via `profileToForm` → `buildRiskInput`. Adds
a 4-band (Low/Medium/High/Critical) bucketing local to this module (`craBandFromScore`) rather than
touching the onboarding engine's 3-band `RISK_RATINGS` contract, which other shipped code depends on
(`StatusBadge`, escalation logic). Review cadence per band (annual/annual/6-months/quarterly). No
cron/scheduler exists in this app, so "Recalculate All" is a manual admin/compliance action.

**Phase 4 — Transaction Monitoring, Screening Rules, Alerts** (`src/lib/transactions/`, `/transactions`,
`/screening-rules`, `/alerts`): new `Transaction`/`ScreeningRule`/`Alert` models. No core-banking feed
exists (or is realistic to fake), so transactions are entered manually — a real, working data-entry
point. Rules are **structured/parameterized, not a free-text DSL** (`rules.ts`, hand-rolled, unit-tested):
velocity+sum (structuring), large single transaction, high-risk counterparty jurisdiction (reuses
`Country.fatfStatus`). A parameterized builder was chosen deliberately over parsing/eval'ing arbitrary
rule text, which would be a real injection surface. Every recorded transaction is screened against all
ACTIVE rules immediately; matches create Alerts. "Live" monitoring is auto-refresh polling
(`router.refresh()` every 15s), not a websocket push — labeled accordingly.

**Phase 5 — Case Management + STR Reports** (`src/lib/investigations/`, `src/lib/str/`,
`/investigations`, `/str-reports`): a new `InvestigationCase` model — distinct from `KycCase` (onboarding)
— is what an escalated Alert becomes. New/Investigating/Awaiting Approval/Closed kanban. `Alert` has no
direct FK to `KycCase` (two-hop chain through `Transaction`), so `InvestigationCase.kycCaseId` is
denormalized at escalation time. `StrReport` is creatable standalone against any approved client or
linked to an investigation. `ScreeningRule.action`'s `CREATE_STR` option stays disabled — auto-filing an
STR from a rule match needs a product decision on narrative generation, not guessed at.

**Phase 6 — Reports & Analytics** (`src/lib/reports/`, `/reports-analytics`): date-range stat cards +
KYC status breakdown (reuses the existing dashboard's `StatusBreakdownChart`) + a new Alert Volume by
Category chart, following the same dataviz-validated conventions as the existing dashboard charts.
"Export PDF" is the browser's native print-to-PDF (`window.print()` + `print:hidden` on the sidebar/
header) — a real export with no new rendering dependency, not a placeholder button.

**Sidebar**: three new nav groups — Screening & Risk (List Screening, Sanctions Lists, Risk Assessment),
Transactions & Alerts (Transaction Monitoring, Alerts, Cases), Reports (STR Reports, Reports &
Analytics) — plus Screening Rules added to the existing System group. Role gating: Front Office can
record transactions and view monitoring (operational); everything else in Module 4 is compliance/
manager/admin-only.

## 15. Sources

- FATF black/grey lists after June 2026 plenary: [fatf-gafi.org increased monitoring](https://www.fatf-gafi.org/en/publications/High-risk-and-other-monitored-jurisdictions/increased-monitoring-june-2026.html), [fatf-gafi.org black and grey lists](https://www.fatf-gafi.org/en/countries/black-and-grey-lists.html), [ComplyAdvantage June 2026 plenary summary](https://complyadvantage.com/insights/fatf-plenary-june-2026-outcomes/)
- OFAC SDN list (public XML feed): https://www.treasury.gov/ofac/downloads/sdn.xml
- UN Security Council Consolidated List (public XML feed): https://scsanctions.un.org/resources/xml/en/consolidated.xml
