// Central enum-like unions. SQLite has no native enums, so these unions +
// zod schemas are the single source of truth for allowed values.

export const ROLES = ['FRONT_OFFICE', 'COMPLIANCE_OFFICER', 'SENIOR_MANAGER', 'ADMIN'] as const;
export type Role = (typeof ROLES)[number];

export const CASE_STATUSES = [
  'DRAFT',
  'PENDING_COMPLIANCE',
  'RETURNED',
  'PENDING_MANAGER',
  'APPROVED',
  'REJECTED',
] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];

// Statuses where the portal client can no longer upload documents or sign:
// DRAFT hasn't been submitted by front office yet, APPROVED/REJECTED are closed.
export const CASE_STATUSES_CLOSED_TO_CLIENT: CaseStatus[] = ['DRAFT', 'APPROVED', 'REJECTED'];

export const RISK_RATINGS = ['LOW', 'MEDIUM', 'HIGH'] as const;
export type RiskRating = (typeof RISK_RATINGS)[number];

export const FATF_STATUSES = ['NONE', 'GREY', 'BLACK'] as const;
export type FatfStatus = (typeof FATF_STATUSES)[number];

export const FORM_TYPES = ['NEW_CLIENT', 'KYC_UPDATE'] as const;
export type FormType = (typeof FORM_TYPES)[number];

export const CLIENT_TYPES = ['INDIVIDUAL', 'CORPORATE'] as const;
export type ClientType = (typeof CLIENT_TYPES)[number];

export const TITLES = ['MR', 'MRS', 'MS'] as const;
export type Title = (typeof TITLES)[number];

export const EMPLOYMENT_STATUSES = [
  'EMPLOYEE',
  'SELF_EMPLOYED',
  'STUDENT',
  'UNEMPLOYED',
  'RETIRED',
] as const;
export type EmploymentStatus = (typeof EMPLOYMENT_STATUSES)[number];

export const INCOME_SOURCES = [
  'SALARY',
  'PRIVATE_BUSINESS',
  'PENSION',
  'TRADE_BUSINESS',
  'REAL_ESTATE',
  'INHERITANCE',
  'INVESTMENTS_SAVINGS',
  'OTHER',
] as const;
export type IncomeSource = (typeof INCOME_SOURCES)[number];

export const PREFERRED_CONTACTS = ['WORK', 'PERSONAL'] as const;
export type PreferredContact = (typeof PREFERRED_CONTACTS)[number];

// Mirrors §IV of the paper form
export const PEP_POSITIONS = [
  'HEAD_OF_STATE_MINISTER',
  'SNR_GOVERNMENT_OFFICIAL',
  'SNR_POLITICIAN',
  'SNR_MILITARY',
  'JUDGE_JUDICIAL',
  'SNR_STATE_COMPANY_EXEC',
  'AMBASSADOR_DIPLOMAT',
  'MEMBER_OF_PARLIAMENT',
  'INTL_ORG_OFFICIAL',
  'MUNICIPALITY_HEAD',
  'ROYAL_FAMILY',
  'CLOSE_ASSOCIATE',
] as const;
export type PepPosition = (typeof PEP_POSITIONS)[number];

export const MANAGER_TYPES = ['POA', 'GUARDIAN', 'OTHER'] as const;
export type ManagerType = (typeof MANAGER_TYPES)[number];

export const DOC_TYPES = [
  'CIVIL_ID',
  'PASSPORT',
  'SALARY_CERT',
  'POA',
  'COURT_ORDER',
  'SOURCE_OF_FUNDS',
  'COMMERCIAL_LICENSE',
  'MEMORANDUM_ARTICLES',
  'BOARD_RESOLUTION',
  'FINANCIAL_STATEMENTS',
  'SHAREHOLDER_REGISTER',
  'OTHER',
] as const;
export type DocType = (typeof DOC_TYPES)[number];

// §II — company legal structure
export const COMPANY_TYPES = [
  'LIMITED_PARTNERSHIP',
  'GENERAL_SHAREHOLDING',
  'CLOSED_SHAREHOLDING',
  'SOLE_PROPRIETORSHIP',
  'NONPROFIT',
  'GOVERNMENT',
  'FINANCIAL_INSTITUTION',
  'INVESTMENT_FUND',
  'HOLDING_COMPANY',
  'OTHER',
] as const;
export type CompanyType = (typeof COMPANY_TYPES)[number];

export const CORPORATE_INCOME_SOURCES = ['AUTHORIZED_ACTIVITIES', 'INVESTMENT_INCOME', 'OTHER'] as const;
export type CorporateIncomeSource = (typeof CORPORATE_INCOME_SOURCES)[number];

export const INVESTMENT_PURPOSES = [
  'CAPITAL_GROWTH',
  'CAPITAL_PROTECTION',
  'INCOME',
  'LIQUIDITY',
  'DIVERSIFICATION',
  'RETURNS',
  'OTHER',
] as const;
export type InvestmentPurpose = (typeof INVESTMENT_PURPOSES)[number];

export const INVESTMENT_PERIODS = ['LONG', 'MEDIUM', 'SHORT'] as const;
export type InvestmentPeriod = (typeof INVESTMENT_PERIODS)[number];

export const TRANSACTION_BANDS = ['BELOW_150K', 'BAND_150K_250K', 'BAND_250K_500K', 'BAND_500K_1M', 'ABOVE_1M'] as const;
export type TransactionBand = (typeof TRANSACTION_BANDS)[number];

export const RISK_TOLERANCES = ['HIGH', 'MEDIUM', 'LOW'] as const;
export type RiskTolerance = (typeof RISK_TOLERANCES)[number];

export const INVESTMENT_EXPERIENCES = ['EXCELLENT', 'GOOD', 'LIMITED', 'OTHER'] as const;
export type InvestmentExperience = (typeof INVESTMENT_EXPERIENCES)[number];

export const INVESTMENT_TYPES = ['BONDS_SUKUK', 'REAL_ESTATE', 'INVESTMENT_FUNDS', 'SHARES'] as const;
export type InvestmentType = (typeof INVESTMENT_TYPES)[number];

export const EXPERIENCE_YEARS = ['MORE_THAN_5', 'ONE_TO_FIVE', 'LESS_THAN_1'] as const;
export type ExperienceYears = (typeof EXPERIENCE_YEARS)[number];

export const CORRESPONDENCE_METHODS = ['MOBILE', 'EMAIL'] as const;
export type CorrespondenceMethod = (typeof CORRESPONDENCE_METHODS)[number];

export const CLIENT_CATEGORIES = ['RETAIL', 'PROFESSIONAL_BY_NATURE', 'QUALIFIED_PROFESSIONAL'] as const;
export type ClientCategory = (typeof CLIENT_CATEGORIES)[number];

export const COMPLIANCE_DECISIONS = ['APPROVED', 'REJECTED', 'RETURNED', 'ESCALATED'] as const;
export const MANAGER_DECISIONS = ['APPROVED', 'REJECTED'] as const;

// §Transaction monitoring
export const TRANSACTION_TYPES = [
  'CASH_DEPOSIT',
  'CASH_WITHDRAWAL',
  'WIRE_IN',
  'WIRE_OUT',
  'INTERNAL_TRANSFER',
] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const TRANSACTION_STATUSES = ['SAFE', 'UNDER_REVIEW', 'BLOCKED'] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

export const RULE_TYPES = ['VELOCITY_COUNT_SUM', 'LARGE_SINGLE_TRANSACTION', 'HIGH_RISK_COUNTRY'] as const;
export type RuleType = (typeof RULE_TYPES)[number];

export const RULE_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export type RulePriority = (typeof RULE_PRIORITIES)[number];

export const RULE_ACTIONS = ['ALERT_ONLY', 'CREATE_STR'] as const;
export type RuleAction = (typeof RULE_ACTIONS)[number];

export const RULE_STATUSES = ['DRAFT', 'ACTIVE', 'DISABLED'] as const;
export type RuleStatus = (typeof RULE_STATUSES)[number];

export const ALERT_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export type AlertSeverity = (typeof ALERT_SEVERITIES)[number];

export const ALERT_TYPES = ['STRUCTURING', 'LARGE_TRANSACTION', 'HIGH_RISK_JURISDICTION'] as const;
export type AlertType = (typeof ALERT_TYPES)[number];

export const ALERT_STATUSES = ['OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED'] as const;
export type AlertStatus = (typeof ALERT_STATUSES)[number];

// §Case management (AML investigations — distinct from KycCase onboarding)
export const INVESTIGATION_STATUSES = ['NEW', 'INVESTIGATING', 'AWAITING_APPROVAL', 'CLOSED'] as const;
export type InvestigationStatus = (typeof INVESTIGATION_STATUSES)[number];

// §STR (Suspicious Transaction Report) filing
export const STR_STATUSES = ['IN_PREPARATION', 'UNDER_REVIEW', 'SUBMITTED'] as const;
export type StrStatus = (typeof STR_STATUSES)[number];

export const AUDIT_ACTIONS = [
  'CASE_CREATED',
  'CASE_UPDATED',
  'CASE_SUBMITTED',
  'RISK_OVERRIDDEN',
  'DOC_UPLOADED',
  'DOC_DOWNLOADED',
  'DOC_DELETED',
  'COMPLIANCE_APPROVED',
  'COMPLIANCE_REJECTED',
  'COMPLIANCE_RETURNED',
  'COMPLIANCE_ESCALATED',
  'MANAGER_APPROVED',
  'MANAGER_REJECTED',
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'LOGOUT',
  'CLIENT_REGISTERED',
  'CLIENT_LOGIN_SUCCESS',
  'CLIENT_LOGIN_FAILED',
  'CLIENT_LOGOUT',
  'CLIENT_DOC_UPLOADED',
  'CLIENT_SIGNED',
  'USER_CREATED',
  'USER_ROLE_CHANGED',
  'USER_ACTIVATED',
  'USER_DEACTIVATED',
  'PASSWORD_CHANGED',
  'COUNTRY_FATF_STATUS_CHANGED',
  'SYSTEM_SETTING_CHANGED',
  'SANCTIONS_SCREENED',
  'CRA_RECALCULATED',
  'TRANSACTION_RECORDED',
  'ALERT_CREATED',
  'ALERT_STATUS_CHANGED',
  'RULE_CREATED',
  'RULE_STATUS_CHANGED',
  'ALERT_ESCALATED',
  'INVESTIGATION_STATUS_CHANGED',
  'STR_CREATED',
  'STR_STATUS_CHANGED',
  'BRANDING_UPDATED',
  'LOGO_UPLOADED',
  'LOGO_REMOVED',
  'TRANSACTION_BATCH_IMPORTED',
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const SETTING_KEYS = {
  domesticCountryCode: 'domesticCountryCode',
  greyListRequiresDocument: 'greyListRequiresDocument',
  brandPrimaryColor: 'brandPrimaryColor',
  brandAccentColor: 'brandAccentColor',
  brandSidebarFromColor: 'brandSidebarFromColor',
  brandSidebarToColor: 'brandSidebarToColor',
  brandLogoFile: 'brandLogoFile',
  brandLogoVersion: 'brandLogoVersion',
} as const;

// Default brand colors (also the "Reset to Default" values in Settings > Branding).
// primaryColor/accentColor feed --color-primary-raw/--color-accent-raw in
// globals.css, which auto-adjust per theme (Midnight/Azure) via color-mix —
// sidebarFromColor/sidebarToColor are unused now that the sidebar is a flat
// theme surface rather than an admin-configurable gradient.
export const BRAND_DEFAULTS = {
  primaryColor: '#4f8cff',
  accentColor: '#f2b830',
  sidebarFromColor: '#ffffff',
  sidebarToColor: '#fbfbfe',
} as const;

// Upload constraints
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_UPLOAD_MIME = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

// Logo upload constraints (Settings > Branding) — smaller cap and image-only,
// unlike the general KYC document upload above.
export const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2 MB
export const ALLOWED_LOGO_MIME = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
] as const;
