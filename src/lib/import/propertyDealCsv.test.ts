import { describe, expect, it } from 'vitest';
import {
  csvToDealRecords,
  detectDuplicateTitles,
  parseCsvText,
  validateDealRows,
} from './propertyDealCsv';

describe('propertyDealCsv', () => {
  it('parses Hebrew headers and validates required fields', () => {
    const table = parseCsvText(
      'כותרת,עיר,מחיר,סטטוס\nבניין א,תל אביב,1000000,למכירה\n,חיפה,500,להשכרה',
    );
    const records = csvToDealRecords(table);
    const preview = validateDealRows(records);
    expect(preview.valid).toHaveLength(1);
    expect(preview.valid[0].status).toBe('for_sale');
    expect(preview.invalid).toHaveLength(1);
  });

  it('detects duplicate titles in file', () => {
    const dupes = detectDuplicateTitles([
      {
        rowNumber: 2,
        title: 'א',
        address: '',
        city: 'תל אביב',
        price: 1,
        kind: 'office',
        status: 'for_rent',
      },
      {
        rowNumber: 3,
        title: 'א',
        address: '',
        city: 'תל אביב',
        price: 2,
        kind: 'office',
        status: 'for_rent',
      },
    ]);
    expect(dupes.length).toBe(1);
  });
});
