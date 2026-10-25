import { describe, expect, it } from 'vitest';
import { decodeCsvBytes, guessColumns, parseCsv, toStock } from './csv';

// 「薬品名,在庫数\r\nカロナール錠200,300\r\n」 in Shift_JIS
const SJIS = new Uint8Array([150, 242, 149, 105, 150, 188, 44, 141, 221, 140, 201, 144, 148, 13, 10, 131, 74, 131, 141, 131, 105, 129, 91, 131, 139, 143, 249, 50, 48, 48, 44, 51, 48, 48, 13, 10]);

describe('stock CSV', () => {
  it('decodes Shift_JIS', () => {
    expect(decodeCsvBytes(SJIS)).toBe('薬品名,在庫数\r\nカロナール錠200,300\r\n');
  });

  it('decodes UTF-8 (with or without BOM)', () => {
    const utf8 = new TextEncoder().encode('﻿アムロジピン錠5mg「サワイ」,10\n');
    expect(decodeCsvBytes(utf8)).toBe('アムロジピン錠5mg「サワイ」,10\n');
  });

  it('parses quoted numbers with commas', () => {
    const rows = parseCsv('"アムロジピン錠5mg「サワイ」","1,200"\r\n');
    expect(rows).toEqual([['アムロジピン錠5mg「サワイ」', '1,200']]);
    expect(toStock(rows, { nameCol: 0, qtyCol: 1, hasHeader: false })).toEqual([{ name: 'アムロジピン錠5mg「サワイ」', qty: 1200 }]);
  });

  it('handles quotes inside quoted fields and empty lines', () => {
    expect(parseCsv('"a ""b""",1\n\nc,2')).toEqual([['a "b"', '1'], ['c', '2']]);
  });

  it('detects a header row', () => {
    const rows = parseCsv(decodeCsvBytes(SJIS));
    expect(guessColumns(rows)).toEqual({ nameCol: 0, qtyCol: 1, hasHeader: true });
    expect(guessColumns([['カロナール錠200', '300']])).toEqual({ nameCol: 0, qtyCol: 1, hasHeader: false });
  });

  it('drops rows without a number', () => {
    const rows = [['薬品名', '在庫数'], ['カロナール錠200', '300'], ['メモ行', ''], ['ロキソニン錠60mg', 'なし']];
    expect(toStock(rows, { nameCol: 0, qtyCol: 1, hasHeader: true })).toEqual([{ name: 'カロナール錠200', qty: 300 }]);
  });

  it('uses the chosen columns', () => {
    const rows = [['001', 'カロナール錠200', '錠', '300']];
    expect(toStock(rows, { nameCol: 1, qtyCol: 3, hasHeader: false })).toEqual([{ name: 'カロナール錠200', qty: 300 }]);
  });
});
