// Batch transaction import — hand-rolled CSV parsing (no dependency needed
// for a well-defined, small-column format), mirrors the house style of
// src/lib/iban.ts / risk/engine.ts / screening/similarity.ts: pure,
// unit-tested, no I/O. The DB-touching half (case lookup, rule evaluation,
// insert) lives in actions.ts and reuses evaluateRule exactly like manual
// entry — a batch row and a manually-recorded transaction go through the
// identical screening pipeline.

import { TRANSACTION_TYPES, type TransactionType } from '@/lib/constants';

const REQUIRED_COLUMNS = ['casenumber', 'type', 'amountkd'] as const;
const KNOWN_COLUMNS = ['casenumber', 'type', 'amountkd', 'counterpartyname', 'counterpartycountry', 'date'] as const;

export interface TransactionImportRow {
  lineNumber: number;
  caseNumber: string;
  type: TransactionType;
  amountKd: number;
  counterpartyName: string | null;
  counterpartyCountry: string | null;
  /** Parsed from an optional `date` column; null means "use import time". */
  transactionDate: Date | null;
}

export interface TransactionImportRowError {
  lineNumber: number;
  reason:
    | 'missingCaseNumber'
    | 'invalidType'
    | 'invalidAmount'
    | 'invalidDate'
    | 'columnCountMismatch';
}

export interface ParseCsvResult {
  rows: string[][];
}

/** Minimal RFC-4180-ish CSV parser: quoted fields, "" escapes a literal quote, CRLF/LF both accepted. */
export function parseCsv(text: string): string[][] {
  const clean = text.replace(/^﻿/, ''); // strip a UTF-8 BOM (common from Excel exports)
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (inQuotes) {
      if (c === '"') {
        if (clean[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\r') {
      // swallow; \n (or end of input) closes the row
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += c;
    }
  }
  // final field/row if the file doesn't end with a newline
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ''));
}

export interface ParsedTransactionImport {
  rows: TransactionImportRow[];
  errors: TransactionImportRowError[];
  /** Set when the header row itself is unusable — parsing stops entirely. */
  headerError?: 'missingRequiredColumns';
}

export function parseTransactionImportCsv(text: string): ParsedTransactionImport {
  const table = parseCsv(text);
  if (table.length === 0) return { rows: [], errors: [], headerError: 'missingRequiredColumns' };

  const header = table[0].map((h) => h.trim().toLowerCase().replace(/[\s_]+/g, ''));
  const missingRequired = REQUIRED_COLUMNS.filter((c) => !header.includes(c));
  if (missingRequired.length > 0) {
    return { rows: [], errors: [], headerError: 'missingRequiredColumns' };
  }
  const colIndex = (name: (typeof KNOWN_COLUMNS)[number]) => header.indexOf(name);
  const idx = {
    caseNumber: colIndex('casenumber'),
    type: colIndex('type'),
    amountKd: colIndex('amountkd'),
    counterpartyName: colIndex('counterpartyname'),
    counterpartyCountry: colIndex('counterpartycountry'),
    date: colIndex('date'),
  };

  const rows: TransactionImportRow[] = [];
  const errors: TransactionImportRowError[] = [];

  for (let i = 1; i < table.length; i++) {
    const cells = table[i];
    const lineNumber = i + 1; // 1-indexed, matching what a spreadsheet shows

    const caseNumber = (cells[idx.caseNumber] ?? '').trim();
    if (!caseNumber) {
      errors.push({ lineNumber, reason: 'missingCaseNumber' });
      continue;
    }

    const typeRaw = (cells[idx.type] ?? '').trim().toUpperCase();
    if (!(TRANSACTION_TYPES as readonly string[]).includes(typeRaw)) {
      errors.push({ lineNumber, reason: 'invalidType' });
      continue;
    }

    const amountRaw = (cells[idx.amountKd] ?? '').trim();
    const amountKd = Number(amountRaw);
    if (!amountRaw || !Number.isFinite(amountKd) || amountKd <= 0) {
      errors.push({ lineNumber, reason: 'invalidAmount' });
      continue;
    }

    let transactionDate: Date | null = null;
    if (idx.date >= 0) {
      const dateRaw = (cells[idx.date] ?? '').trim();
      if (dateRaw) {
        const parsed = new Date(dateRaw);
        if (Number.isNaN(parsed.getTime())) {
          errors.push({ lineNumber, reason: 'invalidDate' });
          continue;
        }
        transactionDate = parsed;
      }
    }

    const counterpartyName = idx.counterpartyName >= 0 ? (cells[idx.counterpartyName] ?? '').trim() || null : null;
    const counterpartyCountry =
      idx.counterpartyCountry >= 0 ? (cells[idx.counterpartyCountry] ?? '').trim().toUpperCase() || null : null;

    rows.push({
      lineNumber,
      caseNumber,
      type: typeRaw as TransactionType,
      amountKd,
      counterpartyName,
      counterpartyCountry,
      transactionDate,
    });
  }

  return { rows, errors };
}

export const TRANSACTION_IMPORT_TEMPLATE =
  'caseNumber,type,amountKd,counterpartyName,counterpartyCountry,date\n' +
  'KYC-2026-00001,CASH_DEPOSIT,1500,,,2026-07-01\n' +
  'KYC-2026-00001,WIRE_OUT,8000,Acme Trading LLC,AE,2026-07-03\n';
