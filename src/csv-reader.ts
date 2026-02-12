import { readFile } from 'node:fs/promises';
import { ActionType, type ParsedEntry } from './parser.js';

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/;

// Parses a CSV line respecting quoted fields (handles commas inside quotes)
const parseCsvLine = (line: string): string[] => {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index++) {
    const char = line[index];

    if (char === '"') {
      const nextChar = line[index + 1];
      if (inQuotes && nextChar === '"') {
        current += '"';
        index++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
};

// Splits full CSV text into row records, preserving newlines inside quoted fields.
const splitCsvRecords = (content: string): string[] => {
  const records: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < content.length; index++) {
    const char = content[index];

    if (char === '"') {
      const nextChar = content[index + 1];
      if (inQuotes && nextChar === '"') {
        current += '""';
        index++;
      } else {
        inQuotes = !inQuotes;
        current += char;
      }
      continue;
    }

    if (!inQuotes && (char === '\n' || char === '\r')) {
      if (char === '\r' && content[index + 1] === '\n') {
        index++;
      }
      records.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  if (current.length > 0) {
    records.push(current);
  }

  if (inQuotes) {
    throw new Error('Malformed CSV: unterminated quoted field.');
  }

  return records;
};

const parseNum = (str: string): number => {
  const cleaned = str.trim();
  if (cleaned === '--' || cleaned === '') return 0;
  const parsed = parseFloat(cleaned.replace(/,/g, ''));
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid numeric field: "${str}"`);
  }
  return parsed;
};

const parseTokenAndSymbol = (tokenField: string): { token: string; tokenSymbol: string } => {
  const match = tokenField.match(/^(.*)\s+\(([^()]+)\)$/);
  if (!match) {
    return {
      token: tokenField,
      tokenSymbol: tokenField,
    };
  }

  return {
    token: match[1].trim(),
    tokenSymbol: match[2].trim(),
  };
};

const getCsvUtcOffsetMinutes = (dateHeaderField: string): number => {
  const utcMatch = dateHeaderField.match(/UTC(?:\s*([+-])\s*(\d{1,2})(?::?(\d{2}))?)?/i);
  if (!utcMatch || !utcMatch[1]) {
    return 0;
  }

  const sign = utcMatch[1] === '-' ? -1 : 1;
  const hours = Number(utcMatch[2]);
  const minutes = Number(utcMatch[3] ?? '0');

  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || minutes < 0 || minutes > 59) {
    throw new Error(`Invalid UTC offset in header: "${dateHeaderField}"`);
  }

  return sign * (hours * 60 + minutes);
};

const parseCsvDate = (dateStr: string, csvUtcOffsetMinutes: number): Date => {
  const trimmed = dateStr.trim();
  const matched = trimmed.match(DATE_PATTERN);

  if (matched) {
    const [, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr] = matched;
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);
    const hour = Number(hourStr);
    const minute = Number(minuteStr);
    const second = Number(secondStr);

    const utcMillis =
      Date.UTC(year, month - 1, day, hour, minute, second) - csvUtcOffsetMinutes * 60 * 1000;
    return new Date(utcMillis);
  }

  const fallback = new Date(trimmed);
  if (Number.isNaN(fallback.getTime())) {
    throw new Error(`Invalid date field: "${dateStr}"`);
  }
  return fallback;
};

export const readTransactionsCsv = async (filePath: string): Promise<ParsedEntry[]> => {
  const content = await readFile(filePath, 'utf-8');
  const records = splitCsvRecords(content).filter((record) => record.trim() !== '');
  if (records.length === 0) return [];

  const headerFields = parseCsvLine(records[0]);
  const csvUtcOffsetMinutes = getCsvUtcOffsetMinutes(headerFields[0] ?? '');

  // Skip header row
  return records.slice(1).map((record) => {
    const [dateStr, tokenField, type, price, amount, , fee] = parseCsvLine(record);

    if (!dateStr || !tokenField || !type || !price || !amount || fee === undefined) {
      throw new Error(`Malformed transaction row: "${record}"`);
    }

    const { token, tokenSymbol } = parseTokenAndSymbol(tokenField);

    const normalizedType = type.trim().toLowerCase();
    if (normalizedType !== 'buy' && normalizedType !== 'sell') {
      throw new Error(`Unknown transaction type: ${type}`);
    }

    return {
      date: parseCsvDate(dateStr, csvUtcOffsetMinutes),
      token,
      tokenSymbol,
      price: parseNum(price),
      fee: parseNum(fee),
      amountOfToken: parseNum(amount),
      type: normalizedType === 'buy' ? ActionType.BUY : ActionType.SELL,
    };
  });
};
