# AML System — KYC Module (Individuals)

An Anti-Money-Laundering compliance platform. This first module delivers **KYC for
individual clients** with a bilingual (English/Arabic, RTL) UI and a 3-stage
maker→checker→approver workflow, FATF country screening, an auto-scoring risk
engine, and full field/document encryption.

See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for architecture and
[CHANGELOG.md](./CHANGELOG.md) for the change history.

## Stack

Next.js 15 (App Router, TypeScript) · Tailwind CSS v4 · Prisma · SQLite (dev) /
PostgreSQL (prod) · react-hook-form + zod · jose (JWT sessions) · bcryptjs ·
Vitest.

## Quick start

```bash
npm install
npx prisma migrate dev      # create the database
npx prisma db seed          # ~240 countries + FATF flags, demo users, settings
npm run dev                 # http://localhost:3000
```

The repo ships a working `.env` for local dev (SQLite + generated keys). For a
real deployment, copy `.env.example`, generate fresh keys, and never commit `.env`.

### Demo accounts

| Role | Email | Password |
|---|---|---|
| Front office (maker) | employee@aml.local | Employee@123 |
| Compliance officer (checker) | compliance@aml.local | Compliance@123 |
| Senior manager (approver) | manager@aml.local | Manager@123 |
| Admin | admin@aml.local | Admin@123 |

## Workflow

1. **Front office** fills the 7-step KYC wizard. The system auto-computes a risk
   rating (Low/Medium/High); the employee may raise it with a justification but
   never lower it. Selecting a FATF grey/black-listed country pops a mandatory
   dialog requiring a source-of-funds document.
2. **Compliance officer** reviews and Approves, Rejects, or Returns for correction.
   Approving a **HIGH-risk** case escalates it to a senior manager instead of
   finalizing.
3. **Senior manager** gives the final Approve/Reject on high-risk cases.

Every transition is written to an append-only audit log shown as a per-case timeline.

## Security

- **PII columns** (Civil ID, passport, IBAN, phone, address, DOB…) encrypted at
  rest with **AES-256-GCM** (unique IV + auth tag per value).
- **Uploaded documents** encrypted on disk; decrypted only for authorized download.
- **Passwords** hashed with bcrypt (cost 12); **sessions** are signed JWTs in
  httpOnly cookies (8h expiry). Login is rate-limited.
- Security headers (CSP, X-Frame-Options, nosniff…) set in `next.config.ts`.
- Role-based access enforced in middleware **and** re-checked in every page/action.

## Testing

```bash
npm test          # Vitest — risk engine, workflow, encryption, schema validation
```

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm test` | Unit tests |
| `npm run db:migrate` | Prisma migrate |
| `npm run db:seed` | Seed countries/users/settings |

## Switching to PostgreSQL (production)

1. In `prisma/schema.prisma` set `datasource db { provider = "postgresql" }`.
2. Set `DATABASE_URL="postgresql://user:pass@host:5432/aml?schema=public"`.
3. `npx prisma migrate dev` then `npx prisma db seed`.

No application code changes are required — the data layer is provider-agnostic.
