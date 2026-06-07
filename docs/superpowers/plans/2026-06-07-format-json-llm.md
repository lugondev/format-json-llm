# format-json-llm Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Một module JS + UI để convert hai chiều JSON ↔ TOON và sinh schema (JSON Schema 2020-12 + TOON schema nén) nhằm gửi cho LLM hiểu format request/response JSON.

**Architecture:** Tách `src/core/` (thuần logic, zero-DOM, test bằng Vitest) khỏi `src/ui/` (DOM/event). Core wrap thư viện `@toon-format/toon` cho encode/decode và tự viết hai bộ suy luận schema. UI là Vite + Vanilla JS, 2 panel + thanh điều khiển, convert realtime có debounce.

**Tech Stack:** Vite, Vanilla JS (ES modules), `@toon-format/toon` v2.3.0, `gpt-tokenizer`, Vitest.

---

## File Structure

- `package.json` — scripts (dev/build/test), deps.
- `vite.config.js` — cấu hình Vite + Vitest.
- `index.html` — shell UI, nạp `src/main.js`.
- `src/core/toon.js` — `jsonToToon`, `toonToJson` (trả `{ok,...,error}`).
- `src/core/schema-json.js` — `toJsonSchema(value)` → object JSON Schema 2020-12.
- `src/core/schema-toon.js` — `toToonSchema(value)` → chuỗi chữ ký kiểu nén.
- `src/core/tokens.js` — `countTokens(text)`, `compareTokens(jsonText, toonText)`.
- `src/core/index.js` — re-export gộp API core.
- `src/ui/panels.js` — tạo & cập nhật DOM 2 panel + output tabs.
- `src/ui/controls.js` — đọc trạng thái option (delimiter/indent/strict), nút copy/swap.
- `src/ui/app.js` — điều phối: lắng nghe input, gọi core, render output + token bar.
- `src/main.js` — entry, import core + ui, khởi tạo app.
- `src/style.css` — layout 2 cột + thanh điều khiển.
- `tests/toon.test.js`, `tests/schema-json.test.js`, `tests/schema-toon.test.js`, `tests/tokens.test.js`.

---

## Task 1: Scaffold dự án (Vite + Vitest)

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `src/main.js`, `.gitignore` (đã có)

- [ ] **Step 1: Tạo `package.json`**

```json
{
  "name": "format-json-llm",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@toon-format/toon": "^2.3.0",
    "gpt-tokenizer": "^2.9.0"
  },
  "devDependencies": {
    "vite": "^6.0.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Cài deps**

Run: `npm install`
Expected: tạo `node_modules`, không lỗi. Nếu phiên bản minor lệch, chạy `npm install @toon-format/toon@latest gpt-tokenizer@latest vite@latest vitest@latest -D` cho dev deps tương ứng.

- [ ] **Step 3: Tạo `vite.config.js`**

```js
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
  },
});
```

- [ ] **Step 4: Tạo `index.html` tối thiểu**

```html
<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>format-json-llm</title>
    <link rel="stylesheet" href="/src/style.css" />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

- [ ] **Step 5: Tạo `src/main.js` tạm**

```js
document.querySelector('#app').textContent = 'format-json-llm – scaffold OK';
```

- [ ] **Step 6: Verify dev server chạy**

Run: `npm run dev` rồi mở URL in ra (Ctrl+C để dừng).
Expected: trang hiện "format-json-llm – scaffold OK".

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vite.config.js index.html src/main.js
git commit -m "chore: scaffold Vite + Vitest"
```

---

## Task 2: core/toon.js — convert hai chiều

**Files:**
- Create: `src/core/toon.js`
- Test: `tests/toon.test.js`

- [ ] **Step 1: Viết test thất bại**

```js
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
    expect(r.toon).toContain('a[3]: 1|2|3');
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
```

- [ ] **Step 2: Chạy test để xác nhận FAIL**

Run: `npm test -- tests/toon.test.js`
Expected: FAIL ("does not provide an export named 'jsonToToon'").

- [ ] **Step 3: Viết `src/core/toon.js`**

```js
import { encode, decode, ToonDecodeError } from '@toon-format/toon';

export function jsonToToon(jsonString, opts = {}) {
  let value;
  try {
    value = JSON.parse(jsonString);
  } catch (e) {
    return { ok: false, toon: '', error: `JSON không hợp lệ: ${e.message}` };
  }
  try {
    const toon = encode(value, opts);
    return { ok: true, toon, error: null };
  } catch (e) {
    return { ok: false, toon: '', error: `Lỗi encode TOON: ${e.message}` };
  }
}

export function toonToJson(toonString, opts = {}) {
  try {
    const value = decode(toonString, opts);
    return { ok: true, json: JSON.stringify(value, null, 2), value, error: null };
  } catch (e) {
    const msg = e instanceof ToonDecodeError ? e.message : String(e?.message ?? e);
    return { ok: false, json: '', value: undefined, error: `Lỗi decode TOON: ${msg}` };
  }
}
```

- [ ] **Step 4: Chạy test để xác nhận PASS**

Run: `npm test -- tests/toon.test.js`
Expected: PASS toàn bộ.

- [ ] **Step 5: Commit**

```bash
git add src/core/toon.js tests/toon.test.js
git commit -m "feat(core): convert hai chiều JSON <-> TOON"
```

---

## Task 3: core/schema-json.js — suy ra JSON Schema 2020-12

**Files:**
- Create: `src/core/schema-json.js`
- Test: `tests/schema-json.test.js`

Quy tắc: `null` → `{type:'null'}`. Số nguyên → `integer`, số thực → `number`. Object → `type:object` + `properties` + `required` (mọi key có mặt). Mảng rỗng → `{type:'array'}`. Mảng đồng nhất → `items` là schema gộp; nếu phần tử khác kiểu → `items.anyOf`. Với mảng object, `required` = giao của key xuất hiện ở **mọi** phần tử.

- [ ] **Step 1: Viết test thất bại**

```js
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
```

- [ ] **Step 2: Chạy test để xác nhận FAIL**

Run: `npm test -- tests/schema-json.test.js`
Expected: FAIL ("does not provide an export named 'toJsonSchema'").

- [ ] **Step 3: Viết `src/core/schema-json.js`**

```js
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
```

- [ ] **Step 4: Chạy test để xác nhận PASS**

Run: `npm test -- tests/schema-json.test.js`
Expected: PASS toàn bộ.

- [ ] **Step 5: Commit**

```bash
git add src/core/schema-json.js tests/schema-json.test.js
git commit -m "feat(core): suy ra JSON Schema 2020-12 từ dữ liệu mẫu"
```

---

## Task 4: core/schema-toon.js — suy ra TOON schema nén

**Files:**
- Create: `src/core/schema-toon.js`
- Test: `tests/schema-toon.test.js`

Quy tắc rút gọn kiểu: integer→`int`, number→`num`, string→`str`, boolean→`bool`, null→`null`.
- Root object: mỗi key một dòng, dạng `key:<sig>`.
- Object lồng: `{k1:t1,k2:t2}`.
- Mảng object đồng nhất key: `[]{k1:t1,k2:t2}` (lấy phần tử đầu làm khuôn).
- Mảng primitive: `t[]` (vd `str[]`).
- Mảng rỗng: `[]`.

- [ ] **Step 1: Viết test thất bại**

```js
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
```

- [ ] **Step 2: Chạy test để xác nhận FAIL**

Run: `npm test -- tests/schema-toon.test.js`
Expected: FAIL ("does not provide an export named 'toToonSchema'").

- [ ] **Step 3: Viết `src/core/schema-toon.js`**

```js
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
```

- [ ] **Step 4: Chạy test để xác nhận PASS**

Run: `npm test -- tests/schema-toon.test.js`
Expected: PASS toàn bộ.

- [ ] **Step 5: Commit**

```bash
git add src/core/schema-toon.js tests/schema-toon.test.js
git commit -m "feat(core): suy ra TOON schema nén"
```

---

## Task 5: core/tokens.js — đếm & so sánh token

**Files:**
- Create: `src/core/tokens.js`
- Test: `tests/tokens.test.js`

- [ ] **Step 1: Viết test thất bại**

```js
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
    // TOON tiết kiệm token so với JSON pretty cho mẫu dạng bảng
    expect(r.toonTokens).toBeLessThan(r.jsonTokens);
  });

  it('savedPercent = 0 khi jsonTokens = 0', () => {
    expect(compareTokens('', '').savedPercent).toBe(0);
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận FAIL**

Run: `npm test -- tests/tokens.test.js`
Expected: FAIL ("does not provide an export named 'countTokens'").

- [ ] **Step 3: Viết `src/core/tokens.js`**

```js
import { encode as encodeTokens } from 'gpt-tokenizer';

export function countTokens(text) {
  if (!text) return 0;
  try {
    return encodeTokens(text).length;
  } catch {
    // Fallback ước lượng nếu tokenizer lỗi
    return Math.ceil(text.length / 4);
  }
}

export function compareTokens(jsonText, toonText) {
  const jsonTokens = countTokens(jsonText);
  const toonTokens = countTokens(toonText);
  const savedPercent = jsonTokens === 0 ? 0 : Math.round(((jsonTokens - toonTokens) / jsonTokens) * 100);
  return { jsonTokens, toonTokens, savedPercent };
}
```

- [ ] **Step 4: Chạy test để xác nhận PASS**

Run: `npm test -- tests/tokens.test.js`
Expected: PASS toàn bộ.

- [ ] **Step 5: Commit**

```bash
git add src/core/tokens.js tests/tokens.test.js
git commit -m "feat(core): đếm và so sánh token JSON vs TOON"
```

---

## Task 6: core/index.js — gộp API

**Files:**
- Create: `src/core/index.js`

- [ ] **Step 1: Viết `src/core/index.js`**

```js
export { jsonToToon, toonToJson } from './toon.js';
export { toJsonSchema } from './schema-json.js';
export { toToonSchema } from './schema-toon.js';
export { countTokens, compareTokens } from './tokens.js';
```

- [ ] **Step 2: Verify import gộp chạy**

Run: `node --input-type=module -e "import('./src/core/index.js').then(m => console.log(Object.keys(m).sort().join(',')))"`
Expected: in ra `compareTokens,countTokens,jsonToToon,toJsonSchema,toToonSchema,toonToJson`.

- [ ] **Step 3: Commit**

```bash
git add src/core/index.js
git commit -m "feat(core): gộp API core qua index.js"
```

---

## Task 7: UI — style.css

**Files:**
- Create: `src/style.css`

- [ ] **Step 1: Viết `src/style.css`**

```css
* { box-sizing: border-box; }
body { margin: 0; font-family: system-ui, -apple-system, sans-serif; color: #1c2333; background: #f5f6f8; }
header { padding: 12px 16px; background: #11182a; color: #fff; }
header h1 { margin: 0; font-size: 18px; }
header p { margin: 4px 0 0; font-size: 12px; opacity: .75; }
.controls { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; padding: 10px 16px; background: #fff; border-bottom: 1px solid #e2e5ea; font-size: 13px; }
.controls label { display: flex; gap: 4px; align-items: center; }
.controls button { cursor: pointer; border: 1px solid #c3c9d4; background: #fff; border-radius: 6px; padding: 6px 10px; font-size: 13px; }
.controls button.primary { background: #2b59ff; color: #fff; border-color: #2b59ff; }
.workspace { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 12px 16px; }
.panel { display: flex; flex-direction: column; background: #fff; border: 1px solid #e2e5ea; border-radius: 8px; overflow: hidden; }
.panel-head { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-bottom: 1px solid #eef0f3; font-size: 13px; font-weight: 600; }
.panel-head .tabs button { border: none; background: none; cursor: pointer; padding: 4px 8px; font-size: 12px; color: #5a6478; border-radius: 4px; }
.panel-head .tabs button.active { background: #eef1ff; color: #2b59ff; }
textarea, pre.output { flex: 1; min-height: 360px; margin: 0; padding: 12px; border: none; font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: 13px; line-height: 1.5; white-space: pre; overflow: auto; }
textarea { resize: none; outline: none; }
pre.output { background: #fbfbfd; }
.error { color: #c0392b; padding: 8px 12px; font-size: 12px; background: #fdecea; border-top: 1px solid #f5c6c0; white-space: pre-wrap; }
.error:empty { display: none; }
.tokenbar { display: flex; gap: 16px; padding: 8px 16px; font-size: 13px; background: #fff; border-top: 1px solid #e2e5ea; }
.tokenbar strong { color: #2b59ff; }
.copy-btn { font-size: 11px; padding: 2px 8px; }
```

- [ ] **Step 2: Commit**

```bash
git add src/style.css
git commit -m "feat(ui): style layout 2 cột"
```

---

## Task 8: UI — controls.js (đọc option + tiện ích)

**Files:**
- Create: `src/ui/controls.js`

- [ ] **Step 1: Viết `src/ui/controls.js`**

```js
// Map nhãn delimiter -> ký tự thật cho @toon-format/toon
export const DELIMITERS = { comma: ',', tab: '\t', pipe: '|' };

export function readEncodeOptions(root) {
  const delimiterKey = root.querySelector('#delimiter').value;
  const indent = Number(root.querySelector('#indent').value) || 2;
  const keyFolding = root.querySelector('#keyFolding').checked ? 'safe' : 'off';
  return { delimiter: DELIMITERS[delimiterKey], indent, keyFolding };
}

export function readDecodeOptions(root) {
  const indent = Number(root.querySelector('#indent').value) || 2;
  const strict = root.querySelector('#strict').checked;
  const expandPaths = root.querySelector('#keyFolding').checked ? 'safe' : 'off';
  return { indent, strict, expandPaths };
}

export function debounce(fn, ms = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/ui/controls.js
git commit -m "feat(ui): đọc option encode/decode + tiện ích copy/debounce"
```

---

## Task 9: UI — panels.js (dựng DOM)

**Files:**
- Create: `src/ui/panels.js`

- [ ] **Step 1: Viết `src/ui/panels.js`**

```js
// Trả về chuỗi HTML cho toàn bộ UI và gắn vào root.
export function renderShell(root) {
  root.innerHTML = `
    <header>
      <h1>format-json-llm</h1>
      <p>Convert JSON ↔ TOON và sinh schema (JSON Schema + TOON schema) cho LLM</p>
    </header>
    <div class="controls">
      <label>Nguồn:
        <select id="source">
          <option value="json">JSON</option>
          <option value="toon">TOON</option>
        </select>
      </label>
      <label>Delimiter:
        <select id="delimiter">
          <option value="comma">,</option>
          <option value="tab">tab</option>
          <option value="pipe">|</option>
        </select>
      </label>
      <label>Indent: <input id="indent" type="number" min="0" max="8" value="2" style="width:48px" /></label>
      <label><input id="strict" type="checkbox" checked /> strict</label>
      <label><input id="keyFolding" type="checkbox" /> keyFolding</label>
      <button id="swap">⇄ Đảo nguồn</button>
    </div>
    <div class="workspace">
      <div class="panel">
        <div class="panel-head"><span id="inputLabel">Input (JSON)</span></div>
        <textarea id="input" placeholder="Dán JSON hoặc TOON vào đây..." spellcheck="false"></textarea>
        <div class="error" id="inputError"></div>
      </div>
      <div class="panel">
        <div class="panel-head">
          <div class="tabs">
            <button data-tab="convert" class="active">Convert</button>
            <button data-tab="jsonschema">JSON Schema</button>
            <button data-tab="toonschema">TOON Schema</button>
          </div>
          <button class="copy-btn" id="copyOut">Copy</button>
        </div>
        <pre class="output" id="output"></pre>
        <div class="error" id="outputError"></div>
      </div>
    </div>
    <div class="tokenbar">
      <span>JSON: <strong id="jsonTokens">0</strong> tokens</span>
      <span>TOON: <strong id="toonTokens">0</strong> tokens</span>
      <span>Tiết kiệm: <strong id="savedPercent">0%</strong></span>
    </div>
  `;
}

export function setOutput(root, text) {
  root.querySelector('#output').textContent = text;
}

export function setError(root, id, message) {
  root.querySelector(`#${id}`).textContent = message || '';
}

export function setTokens(root, { jsonTokens, toonTokens, savedPercent }) {
  root.querySelector('#jsonTokens').textContent = jsonTokens;
  root.querySelector('#toonTokens').textContent = toonTokens;
  root.querySelector('#savedPercent').textContent = `${savedPercent}%`;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/ui/panels.js
git commit -m "feat(ui): dựng DOM shell 2 panel + token bar"
```

---

## Task 10: UI — app.js (điều phối)

**Files:**
- Create: `src/ui/app.js`

Hành vi: theo `#source` (json/toon) quyết định chiều convert. Tab `convert` hiện kết quả convert; tab `jsonschema`/`toonschema` hiện schema suy ra từ dữ liệu (luôn parse về object trước). Token bar so sánh JSON-pretty vs TOON cho cùng dữ liệu. Debounce 300ms.

- [ ] **Step 1: Viết `src/ui/app.js`**

```js
import { jsonToToon, toonToJson, toJsonSchema, toToonSchema, compareTokens } from '../core/index.js';
import { renderShell, setOutput, setError, setTokens } from './panels.js';
import { readEncodeOptions, readDecodeOptions, debounce, copyText } from './controls.js';

let activeTab = 'convert';

// Lấy về { value, json, toon, error } từ input theo nguồn hiện tại.
function normalize(root) {
  const source = root.querySelector('#source').value;
  const text = root.querySelector('#input').value;
  if (!text.trim()) return { empty: true };

  if (source === 'json') {
    const enc = jsonToToon(text, readEncodeOptions(root));
    if (!enc.ok) return { error: enc.error };
    return { value: JSON.parse(text), json: JSON.stringify(JSON.parse(text), null, 2), toon: enc.toon };
  }
  const dec = toonToJson(text, readDecodeOptions(root));
  if (!dec.ok) return { error: dec.error };
  return { value: dec.value, json: dec.json, toon: text };
}

function render(root) {
  setError(root, 'inputError', '');
  setError(root, 'outputError', '');
  const data = normalize(root);

  if (data?.empty) {
    setOutput(root, '');
    setTokens(root, { jsonTokens: 0, toonTokens: 0, savedPercent: 0 });
    return;
  }
  if (data.error) {
    setOutput(root, '');
    setError(root, 'inputError', data.error);
    return;
  }

  const source = root.querySelector('#source').value;
  if (activeTab === 'convert') {
    setOutput(root, source === 'json' ? data.toon : data.json);
  } else if (activeTab === 'jsonschema') {
    setOutput(root, JSON.stringify(toJsonSchema(data.value), null, 2));
  } else {
    setOutput(root, toToonSchema(data.value));
  }
  setTokens(root, compareTokens(data.json, data.toon));
}

export function initApp(root) {
  renderShell(root);
  const rerender = debounce(() => render(root), 300);

  root.querySelector('#input').addEventListener('input', rerender);
  for (const id of ['#source', '#delimiter', '#indent', '#strict', '#keyFolding']) {
    root.querySelector(id).addEventListener('change', () => render(root));
  }

  root.querySelector('#source').addEventListener('change', (e) => {
    root.querySelector('#inputLabel').textContent = `Input (${e.target.value.toUpperCase()})`;
  });

  root.querySelectorAll('.tabs button').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      root.querySelectorAll('.tabs button').forEach((b) => b.classList.toggle('active', b === btn));
      render(root);
    });
  });

  root.querySelector('#swap').addEventListener('click', () => {
    const data = normalize(root);
    if (data.error || data?.empty) return;
    const source = root.querySelector('#source');
    if (source.value === 'json') {
      source.value = 'toon';
      root.querySelector('#input').value = data.toon;
    } else {
      source.value = 'json';
      root.querySelector('#input').value = data.json;
    }
    root.querySelector('#inputLabel').textContent = `Input (${source.value.toUpperCase()})`;
    render(root);
  });

  root.querySelector('#copyOut').addEventListener('click', async () => {
    const ok = await copyText(root.querySelector('#output').textContent);
    const btn = root.querySelector('#copyOut');
    btn.textContent = ok ? 'Đã copy ✓' : 'Lỗi copy';
    setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
  });

  render(root);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/ui/app.js
git commit -m "feat(ui): điều phối convert/schema/token + swap + copy"
```

---

## Task 11: Nối entry main.js + kiểm thử thủ công

**Files:**
- Modify: `src/main.js`

- [ ] **Step 1: Thay `src/main.js`**

```js
import './style.css';
import { initApp } from './ui/app.js';

initApp(document.querySelector('#app'));
```

- [ ] **Step 2: Chạy toàn bộ test core**

Run: `npm test`
Expected: tất cả test PASS (toon, schema-json, schema-toon, tokens).

- [ ] **Step 3: Kiểm thử thủ công UI**

Run: `npm run dev`, mở URL.
Kiểm tra checklist:
- Dán JSON `{"users":[{"id":1,"name":"An"},{"id":2,"name":"Bình"}],"total":2}` với nguồn JSON → ô output hiện TOON dạng bảng; token bar hiện % tiết kiệm > 0.
- Tab "JSON Schema" → hiện schema 2020-12; tab "TOON Schema" → hiện `users:[]{id:int,name:str}` + `total:int`.
- Bấm "⇄ Đảo nguồn" → input thành TOON, nguồn = TOON, output thành JSON.
- Dán JSON sai → hiện lỗi đỏ ở panel input, không crash.
- Đổi delimiter sang pipe → mảng primitive dùng `|`.
- Bấm Copy → nút đổi thành "Đã copy ✓".

- [ ] **Step 4: Commit**

```bash
git add src/main.js
git commit -m "feat: nối UI vào entry, hoàn tất bản đầu"
```

---

## Self-Review checklist (đã rà)

- **Spec coverage:** convert hai chiều (Task 2), JSON Schema (Task 3), TOON schema (Task 4), token compare (Task 5), UI 2 panel + tabs + tokenbar + delimiter/indent/strict/keyFolding + swap + copy + realtime debounce + báo lỗi (Task 7–11). Prompt builder để ở phạm vi sau (tùy chọn trong spec) — không bắt buộc bản đầu.
- **Placeholder scan:** không có TBD/TODO; mọi step có code/command cụ thể.
- **Type consistency:** API core khớp giữa các task (`jsonToToon/toonToJson` trả `{ok,toon|json,value,error}`; `toJsonSchema`/`toToonSchema`/`compareTokens` dùng nhất quán trong `app.js`). Hàm `normalize` trả `{value,json,toon}` được dùng đồng nhất cho convert/schema/token/swap.

## Ghi chú phụ thuộc môi trường
- Nếu `npm test` báo lệch phiên bản `@toon-format/toon` (cú pháp output có thể thay đổi giữa major), kiểm tra lại assertion `users[2]{id,name}:` so với output thực bằng: `node --input-type=module -e "import('@toon-format/toon').then(m=>console.log(m.encode({users:[{id:1,name:'An'}]})))"` rồi chỉnh test cho khớp.
