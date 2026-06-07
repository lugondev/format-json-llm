import { describe, it, expect } from 'vitest';
import { toToonSchema } from '../src/core/schema-toon.js';

describe('toToonSchema', () => {
  it('root object: one key per line', () => {
    const s = toToonSchema({ id: 1, name: 'Alice', active: true, price: 9.5 });
    expect(s).toBe('id:int\nname:str\nactive:bool\nprice:num');
  });

  it('object array becomes []{...}', () => {
    const s = toToonSchema({ users: [{ id: 1, name: 'Alice' }] });
    expect(s).toBe('users:[]{id:int,name:str}');
  });

  it('primitive array becomes t[]', () => {
    expect(toToonSchema({ tags: ['a', 'b'] })).toBe('tags:str[]');
  });

  it('nested object becomes {...}', () => {
    expect(toToonSchema({ meta: { page: 1, total: 9 } })).toBe('meta:{page:int,total:int}');
  });

  it('null and empty array', () => {
    expect(toToonSchema({ note: null, items: [] })).toBe('note:null\nitems:[]');
  });

  it('array of arrays recurses to the correct type', () => {
    expect(toToonSchema({ m: [[1, 2], [3, 4]] })).toBe('m:int[][]');
  });

  it('array of objects recurses into nested fields', () => {
    expect(toToonSchema({ rows: [{ id: 1, tags: ['a'] }] })).toBe('rows:[]{id:int,tags:str[]}');
  });
});
