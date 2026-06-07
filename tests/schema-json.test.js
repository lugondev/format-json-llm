import { describe, it, expect } from 'vitest';
import { toJsonSchema } from '../src/core/schema-json.js';

describe('toJsonSchema', () => {
  it('flat object with integer, string, boolean', () => {
    const s = toJsonSchema({ id: 1, name: 'Alice', active: true });
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

  it('a float is number', () => {
    expect(toJsonSchema({ price: 9.5 }).properties.price).toEqual({ type: 'number' });
  });

  it('object array: items has properties, required is the intersection of keys', () => {
    const s = toJsonSchema({ users: [{ id: 1, name: 'Alice' }, { id: 2 }] });
    expect(s.properties.users.type).toBe('array');
    expect(s.properties.users.items.type).toBe('object');
    expect(s.properties.users.items.required).toEqual(['id']);
    expect(Object.keys(s.properties.users.items.properties).sort()).toEqual(['id', 'name']);
  });

  it('homogeneous primitive array', () => {
    expect(toJsonSchema({ tags: ['a', 'b'] }).properties.tags).toEqual({
      type: 'array',
      items: { type: 'string' },
    });
  });

  it('null maps to type null', () => {
    expect(toJsonSchema({ note: null }).properties.note).toEqual({ type: 'null' });
  });

  it('mixed-type array uses anyOf', () => {
    const items = toJsonSchema({ mix: [1, 'a'] }).properties.mix.items;
    expect(items.anyOf).toEqual([{ type: 'integer' }, { type: 'string' }]);
  });
});
