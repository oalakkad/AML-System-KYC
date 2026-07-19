import { describe, it, expect } from 'vitest';
import { parseCsv, parseTransactionImportCsv } from './csv';

describe('parseCsv', () => {
  it('parses a simple comma-separated table', () => {
    const rows = parseCsv('a,b,c\n1,2,3\n');
    expect(rows).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ]);
  });

  it('handles quoted fields containing commas', () => {
    const rows = parseCsv('name,note\n"Acme, Inc.",hello\n');
    expect(rows).toEqual([
      ['name', 'note'],
      ['Acme, Inc.', 'hello'],
    ]);
  });

  it('handles an escaped double quote inside a quoted field', () => {
    const rows = parseCsv('name\n"Say ""hi"""\n');
    expect(rows).toEqual([['name'], ['Say "hi"']]);
  });

  it('accepts CRLF line endings', () => {
    const rows = parseCsv('a,b\r\n1,2\r\n');
    expect(rows).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('parses the final row even without a trailing newline', () => {
    const rows = parseCsv('a,b\n1,2');
    expect(rows).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('strips a leading UTF-8 BOM', () => {
    const rows = parseCsv('﻿a,b\n1,2\n');
    expect(rows[0]).toEqual(['a', 'b']);
  });
});

describe('parseTransactionImportCsv', () => {
  it('parses valid rows with all columns', () => {
    const csv =
      'caseNumber,type,amountKd,counterpartyName,counterpartyCountry,date\n' +
      'KYC-2026-00001,CASH_DEPOSIT,1500,,,2026-07-01\n' +
      'KYC-2026-00001,WIRE_OUT,8000,Acme Trading LLC,AE,2026-07-03\n';
    const result = parseTransactionImportCsv(csv);
    expect(result.errors).toHaveLength(0);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toMatchObject({ caseNumber: 'KYC-2026-00001', type: 'CASH_DEPOSIT', amountKd: 1500 });
    expect(result.rows[1].counterpartyCountry).toBe('AE');
    expect(result.rows[0].transactionDate?.toISOString().slice(0, 10)).toBe('2026-07-01');
  });

  it('accepts headers regardless of case/spacing', () => {
    const csv = 'Case Number, Type , Amount_KD\nKYC-1,CASH_DEPOSIT,500\n';
    const result = parseTransactionImportCsv(csv);
    expect(result.errors).toHaveLength(0);
    expect(result.rows[0].amountKd).toBe(500);
  });

  it('flags a missing case number', () => {
    const csv = 'caseNumber,type,amountKd\n,CASH_DEPOSIT,500\n';
    const result = parseTransactionImportCsv(csv);
    expect(result.errors).toEqual([{ lineNumber: 2, reason: 'missingCaseNumber' }]);
    expect(result.rows).toHaveLength(0);
  });

  it('flags an invalid transaction type', () => {
    const csv = 'caseNumber,type,amountKd\nKYC-1,BITCOIN_TRANSFER,500\n';
    const result = parseTransactionImportCsv(csv);
    expect(result.errors).toEqual([{ lineNumber: 2, reason: 'invalidType' }]);
  });

  it('flags a non-positive or non-numeric amount', () => {
    const csv = 'caseNumber,type,amountKd\nKYC-1,CASH_DEPOSIT,0\nKYC-1,CASH_DEPOSIT,abc\n';
    const result = parseTransactionImportCsv(csv);
    expect(result.errors).toEqual([
      { lineNumber: 2, reason: 'invalidAmount' },
      { lineNumber: 3, reason: 'invalidAmount' },
    ]);
  });

  it('flags an unparseable date', () => {
    const csv = 'caseNumber,type,amountKd,date\nKYC-1,CASH_DEPOSIT,500,not-a-date\n';
    const result = parseTransactionImportCsv(csv);
    expect(result.errors).toEqual([{ lineNumber: 2, reason: 'invalidDate' }]);
  });

  it('reports a header error when required columns are missing', () => {
    const csv = 'foo,bar\n1,2\n';
    const result = parseTransactionImportCsv(csv);
    expect(result.headerError).toBe('missingRequiredColumns');
    expect(result.rows).toHaveLength(0);
  });

  it('reports a header error on a completely empty file', () => {
    const result = parseTransactionImportCsv('');
    expect(result.headerError).toBe('missingRequiredColumns');
  });
});
