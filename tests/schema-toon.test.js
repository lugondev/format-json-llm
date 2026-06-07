import { describe, it, expect } from 'vitest';
import { toToonSchema } from '../src/core/schema-toon.js';

describe('toToonSchema', () => {
  it('root object: mỗi key một dòng', () => {
    const s = toToonSchema({ id: 1, name: 'An', active: true, price: 9.5 });
    expect(s).toBe('id:int\nname:str\nactive:bool\nprice:num');
  });

  it('mảng object thành []{...}', () => {
    const s = toToonSchema({ users: [{ id: 1, name: 'An' }] });
    expect(s).toBe('users:[]{id:int,name:str}');
  });

  it('mảng primitive thành t[]', () => {
    expect(toToonSchema({ tags: ['a', 'b'] })).toBe('tags:str[]');
  });

  it('object lồng thành {...}', () => {
    expect(toToonSchema({ meta: { page: 1, total: 9 } })).toBe('meta:{page:int,total:int}');
  });

  it('null và mảng rỗng', () => {
    expect(toToonSchema({ note: null, items: [] })).toBe('note:null\nitems:[]');
  });
});
