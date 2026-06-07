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
