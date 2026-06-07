const SCHEMA_URI = 'https://json-schema.org/draft/2020-12/schema';

function nodeSchema(value) {
  if (value === null) return { type: 'null' };
  if (Array.isArray(value)) return arraySchema(value);
  switch (typeof value) {
    case 'string': return { type: 'string' };
    case 'boolean': return { type: 'boolean' };
    case 'number': return { type: Number.isInteger(value) ? 'integer' : 'number' };
    case 'object': return objectSchema(value);
    default: return {};
  }
}

function objectSchema(obj) {
  const properties = {};
  const required = [];
  for (const key of Object.keys(obj)) {
    properties[key] = nodeSchema(obj[key]);
    required.push(key);
  }
  const schema = { type: 'object', properties };
  if (required.length) schema.required = required;
  return schema;
}

function schemaKey(schema) {
  return JSON.stringify(schema);
}

function arraySchema(arr) {
  if (arr.length === 0) return { type: 'array' };
  const elementSchemas = arr.map(nodeSchema);
  const allObjects = arr.every((v) => v !== null && typeof v === 'object' && !Array.isArray(v));
  if (allObjects) return { type: 'array', items: mergeObjectSchemas(arr) };

  const unique = [];
  const seen = new Set();
  for (const s of elementSchemas) {
    const k = schemaKey(s);
    if (!seen.has(k)) { seen.add(k); unique.push(s); }
  }
  return { type: 'array', items: unique.length === 1 ? unique[0] : { anyOf: unique } };
}

function mergeObjectSchemas(objects) {
  const properties = {};
  let required = null;
  for (const obj of objects) {
    const keys = Object.keys(obj);
    required = required === null ? new Set(keys) : new Set(keys.filter((k) => required.has(k)));
    for (const key of keys) {
      if (!(key in properties)) properties[key] = nodeSchema(obj[key]);
    }
  }
  const schema = { type: 'object', properties };
  const req = [...(required ?? [])];
  if (req.length) schema.required = req;
  return schema;
}

export function toJsonSchema(value) {
  return { $schema: SCHEMA_URI, ...nodeSchema(value) };
}
