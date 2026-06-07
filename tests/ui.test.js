// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { initApp } from '../src/ui/app.js';

// Set the input value, then force an immediate render via a 'change' event (bypasses debounce).
function typeInput(root, text) {
  root.querySelector('#input').value = text;
  root.querySelector('#indent').dispatchEvent(new Event('change'));
}

describe('UI integration', () => {
  let root;
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    root = document.querySelector('#app');
    initApp(root);
  });

  it('builds all controls and panels', () => {
    expect(root.querySelector('#input')).toBeTruthy();
    expect(root.querySelector('#output')).toBeTruthy();
    expect(root.querySelectorAll('.tabs button').length).toBe(3);
  });

  it('JSON -> TOON on the convert tab + updates the token bar', () => {
    typeInput(root, JSON.stringify({ users: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }] }));
    expect(root.querySelector('#output').textContent).toContain('users[2]{id,name}:');
    expect(Number(root.querySelector('#jsonTokens').textContent)).toBeGreaterThan(0);
    expect(Number(root.querySelector('#toonTokens').textContent)).toBeGreaterThan(0);
  });

  it('TOON Schema tab shows the compact signature', () => {
    typeInput(root, JSON.stringify({ users: [{ id: 1, name: 'Alice' }], total: 1 }));
    root.querySelector('.tabs button[data-tab="toonschema"]').dispatchEvent(new Event('click'));
    expect(root.querySelector('#output').textContent).toBe('users:[]{id:int,name:str}\ntotal:int');
  });

  it('JSON Schema tab shows a 2020-12 schema', () => {
    typeInput(root, JSON.stringify({ id: 1 }));
    root.querySelector('.tabs button[data-tab="jsonschema"]').dispatchEvent(new Event('click'));
    const out = JSON.parse(root.querySelector('#output').textContent);
    expect(out.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
    expect(out.properties.id).toEqual({ type: 'integer' });
  });

  it('malformed JSON shows an error in the input panel', () => {
    typeInput(root, '{ not json');
    expect(root.querySelector('#inputError').textContent).toMatch(/JSON/i);
    expect(root.querySelector('#output').textContent).toBe('');
  });

  it('swap: JSON -> TOON, source switches to toon, input becomes TOON', () => {
    typeInput(root, JSON.stringify({ a: [1, 2, 3] }));
    root.querySelector('#swap').dispatchEvent(new Event('click'));
    expect(root.querySelector('#source').value).toBe('toon');
    expect(root.querySelector('#input').value).toContain('a[3]:');
    // after swap, the convert tab shows JSON again
    expect(root.querySelector('#output').textContent).toContain('"a"');
  });

  it('pipe delimiter affects the output', () => {
    root.querySelector('#delimiter').value = 'pipe';
    typeInput(root, JSON.stringify({ a: [1, 2, 3] }));
    expect(root.querySelector('#output').textContent).toContain('1|2|3');
  });

  it('re-initializing resets the active tab to convert (per-instance state)', () => {
    // Switch to a schema tab on the first instance.
    typeInput(root, JSON.stringify({ id: 1 }));
    root.querySelector('.tabs button[data-tab="toonschema"]').dispatchEvent(new Event('click'));
    expect(root.querySelector('#output').textContent).toBe('id:int');

    // Re-init a fresh app into the same container; the tab must start back at convert.
    initApp(root);
    typeInput(root, JSON.stringify({ id: 1 }));
    expect(root.querySelector('#output').textContent).toBe('id: 1'); // TOON, not the schema
  });
});
