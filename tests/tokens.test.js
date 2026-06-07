import { describe, it, expect } from 'vitest';
import { countTokens, compareTokens } from '../src/core/tokens.js';

describe('countTokens', () => {
  it('returns a non-negative integer', () => {
    const n = countTokens('hello world');
    expect(Number.isInteger(n)).toBe(true);
    expect(n).toBeGreaterThan(0);
  });

  it('empty string is 0 tokens', () => {
    expect(countTokens('')).toBe(0);
  });
});

describe('compareTokens', () => {
  it('computes JSON tokens, TOON tokens, and saved %', () => {
    const json = JSON.stringify({ users: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }] }, null, 2);
    const toon = 'users[2]{id,name}:\n  1,Alice\n  2,Bob\n';
    const r = compareTokens(json, toon);
    expect(r.jsonTokens).toBeGreaterThan(0);
    expect(r.toonTokens).toBeGreaterThan(0);
    expect(typeof r.savedPercent).toBe('number');
    expect(r.toonTokens).toBeLessThan(r.jsonTokens);
  });

  it('savedPercent = 0 when jsonTokens = 0', () => {
    expect(compareTokens('', '').savedPercent).toBe(0);
  });
});
