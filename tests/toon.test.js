import { describe, it, expect } from 'vitest';
import { jsonToToon, toonToJson } from '../src/core/toon.js';

describe('jsonToToon', () => {
  it('encode object có mảng object thành TOON dạng bảng', () => {
    const input = JSON.stringify({ users: [{ id: 1, name: 'An' }, { id: 2, name: 'Bình' }] });
    const r = jsonToToon(input);
    expect(r.ok).toBe(true);
    expect(r.toon).toContain('users[2]{id,name}:');
    expect(r.toon).toContain('1,An');
  });

  it('trả error khi JSON không hợp lệ', () => {
    const r = jsonToToon('{ not json');
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/JSON/i);
  });

  it('dùng delimiter pipe khi được chỉ định', () => {
    const r = jsonToToon(JSON.stringify({ a: [1, 2, 3] }), { delimiter: '|' });
    expect(r.ok).toBe(true);
    // Actual output: a[3|]: 1|2|3  (toon@2.3.0 encodes delimiter into bracket notation)
    expect(r.toon).toContain('a[3|]: 1|2|3');
  });
});

describe('toonToJson', () => {
  it('decode TOON về JSON đã format', () => {
    const toon = 'users[2]{id,name}:\n  1,An\n  2,Bình\n';
    const r = toonToJson(toon);
    expect(r.ok).toBe(true);
    expect(JSON.parse(r.json)).toEqual({ users: [{ id: 1, name: 'An' }, { id: 2, name: 'Bình' }] });
  });

  it('trả error khi TOON sai cú pháp', () => {
    const r = toonToJson('users[5]{id}:\n  1\n');
    expect(r.ok).toBe(false);
    expect(typeof r.error).toBe('string');
  });

  it('round-trip JSON -> TOON -> JSON là bất biến', () => {
    const obj = { users: [{ id: 1, name: 'An', active: true }], total: 1, note: null };
    const toon = jsonToToon(JSON.stringify(obj));
    const back = toonToJson(toon.toon);
    expect(JSON.parse(back.json)).toEqual(obj);
  });
});
