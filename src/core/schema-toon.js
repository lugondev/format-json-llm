function primType(value) {
  if (value === null) return 'null';
  switch (typeof value) {
    case 'string': return 'str';
    case 'boolean': return 'bool';
    case 'number': return Number.isInteger(value) ? 'int' : 'num';
    default: return 'str';
  }
}

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

// Chữ ký kiểu cho một giá trị (không kèm tên key).
function sig(value) {
  if (Array.isArray(value)) return arraySig(value);
  if (isPlainObject(value)) return `{${objectFields(value)}}`;
  return primType(value);
}

function arraySig(arr) {
  if (arr.length === 0) return '[]';
  const first = arr[0];
  if (isPlainObject(first)) return `[]{${objectFields(first)}}`;
  return `${primType(first)}[]`;
}

function objectFields(obj) {
  return Object.keys(obj).map((k) => `${k}:${sig(obj[k])}`).join(',');
}

export function toToonSchema(value) {
  if (isPlainObject(value)) {
    return Object.keys(value).map((k) => `${k}:${sig(value[k])}`).join('\n');
  }
  return sig(value);
}
