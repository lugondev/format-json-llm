import { describe, it, expect } from 'vitest';
import { jsonToToon, toonToJson } from '../src/core/toon.js';

describe('jsonToToon', () => {
  it('encodes an object with an object array into tabular TOON', () => {
    const input = JSON.stringify({ users: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }] });
    const r = jsonToToon(input);
    expect(r.ok).toBe(true);
    expect(r.toon).toContain('users[2]{id,name}:');
    expect(r.toon).toContain('1,Alice');
  });

  it('returns an error for invalid JSON', () => {
    const r = jsonToToon('{ not json');
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/JSON/i);
  });

  it('uses the pipe delimiter when specified', () => {
    const r = jsonToToon(JSON.stringify({ a: [1, 2, 3] }), { delimiter: '|' });
    expect(r.ok).toBe(true);
    // Actual output: a[3|]: 1|2|3  (toon@2.3.0 encodes delimiter into bracket notation)
    expect(r.toon).toContain('a[3|]: 1|2|3');
  });
});

describe('toonToJson', () => {
  it('decodes TOON back to formatted JSON', () => {
    const toon = 'users[2]{id,name}:\n  1,Alice\n  2,Bob\n';
    const r = toonToJson(toon);
    expect(r.ok).toBe(true);
    expect(JSON.parse(r.json)).toEqual({ users: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }] });
  });

  it('returns an error for malformed TOON', () => {
    const r = toonToJson('users[5]{id}:\n  1\n');
    expect(r.ok).toBe(false);
    expect(typeof r.error).toBe('string');
  });

  it('round-trips JSON -> TOON -> JSON losslessly', () => {
    const obj = { users: [{ id: 1, name: 'Alice', active: true }], total: 1, note: null };
    const toon = jsonToToon(JSON.stringify(obj));
    const back = toonToJson(toon.toon);
    expect(JSON.parse(back.json)).toEqual(obj);
  });
});
