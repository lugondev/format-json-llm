import { describe, it, expect } from 'vitest';
import { countTokens, compareTokens } from '../src/core/tokens.js';

describe('countTokens', () => {
  it('trả số nguyên không âm', () => {
    const n = countTokens('hello world');
    expect(Number.isInteger(n)).toBe(true);
    expect(n).toBeGreaterThan(0);
  });

  it('chuỗi rỗng = 0 token', () => {
    expect(countTokens('')).toBe(0);
  });
});

describe('compareTokens', () => {
  it('tính token JSON, TOON và % tiết kiệm', () => {
    const json = JSON.stringify({ users: [{ id: 1, name: 'An' }, { id: 2, name: 'Bình' }] }, null, 2);
    const toon = 'users[2]{id,name}:\n  1,An\n  2,Bình\n';
    const r = compareTokens(json, toon);
    expect(r.jsonTokens).toBeGreaterThan(0);
    expect(r.toonTokens).toBeGreaterThan(0);
    expect(typeof r.savedPercent).toBe('number');
    expect(r.toonTokens).toBeLessThan(r.jsonTokens);
  });

  it('savedPercent = 0 khi jsonTokens = 0', () => {
    expect(compareTokens('', '').savedPercent).toBe(0);
  });
});
