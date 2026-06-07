import { describe, it, expect } from 'vitest';
import { toJsonSchema } from '../src/core/schema-json.js';

describe('toJsonSchema', () => {
  it('object phẳng với integer, string, boolean', () => {
    const s = toJsonSchema({ id: 1, name: 'An', active: true });
    expect(s).toMatchObject({
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      properties: {
        id: { type: 'integer' },
        name: { type: 'string' },
        active: { type: 'boolean' },
      },
      required: ['id', 'name', 'active'],
    });
  });

  it('số thực là number', () => {
    expect(toJsonSchema({ price: 9.5 }).properties.price).toEqual({ type: 'number' });
  });

  it('mảng object: items có properties, required là giao các key', () => {
    const s = toJsonSchema({ users: [{ id: 1, name: 'An' }, { id: 2 }] });
    expect(s.properties.users.type).toBe('array');
    expect(s.properties.users.items.type).toBe('object');
    expect(s.properties.users.items.required).toEqual(['id']);
    expect(Object.keys(s.properties.users.items.properties).sort()).toEqual(['id', 'name']);
  });

  it('mảng primitive đồng nhất', () => {
    expect(toJsonSchema({ tags: ['a', 'b'] }).properties.tags).toEqual({
      type: 'array',
      items: { type: 'string' },
    });
  });

  it('null là type null', () => {
    expect(toJsonSchema({ note: null }).properties.note).toEqual({ type: 'null' });
  });

  it('mảng kiểu hỗn hợp dùng anyOf', () => {
    const items = toJsonSchema({ mix: [1, 'a'] }).properties.mix.items;
    expect(items.anyOf).toEqual([{ type: 'integer' }, { type: 'string' }]);
  });
});
