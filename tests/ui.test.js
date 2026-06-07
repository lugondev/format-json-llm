// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { initApp } from '../src/ui/app.js';

// Đặt giá trị input rồi ép render ngay qua một sự kiện 'change' (không bị debounce).
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

  it('dựng đủ các control và panel', () => {
    expect(root.querySelector('#input')).toBeTruthy();
    expect(root.querySelector('#output')).toBeTruthy();
    expect(root.querySelectorAll('.tabs button').length).toBe(3);
  });

  it('JSON -> TOON ở tab convert + cập nhật token bar', () => {
    typeInput(root, JSON.stringify({ users: [{ id: 1, name: 'An' }, { id: 2, name: 'Bình' }] }));
    expect(root.querySelector('#output').textContent).toContain('users[2]{id,name}:');
    expect(Number(root.querySelector('#jsonTokens').textContent)).toBeGreaterThan(0);
    expect(Number(root.querySelector('#toonTokens').textContent)).toBeGreaterThan(0);
  });

  it('tab TOON Schema hiện chữ ký nén', () => {
    typeInput(root, JSON.stringify({ users: [{ id: 1, name: 'An' }], total: 1 }));
    root.querySelector('.tabs button[data-tab="toonschema"]').dispatchEvent(new Event('click'));
    expect(root.querySelector('#output').textContent).toBe('users:[]{id:int,name:str}\ntotal:int');
  });

  it('tab JSON Schema hiện schema 2020-12', () => {
    typeInput(root, JSON.stringify({ id: 1 }));
    root.querySelector('.tabs button[data-tab="jsonschema"]').dispatchEvent(new Event('click'));
    const out = JSON.parse(root.querySelector('#output').textContent);
    expect(out.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
    expect(out.properties.id).toEqual({ type: 'integer' });
  });

  it('JSON sai cú pháp hiện lỗi ở panel input', () => {
    typeInput(root, '{ not json');
    expect(root.querySelector('#inputError').textContent).toMatch(/JSON/i);
    expect(root.querySelector('#output').textContent).toBe('');
  });

  it('Đảo nguồn: JSON -> TOON, nguồn đổi sang toon, input thành TOON', () => {
    typeInput(root, JSON.stringify({ a: [1, 2, 3] }));
    root.querySelector('#swap').dispatchEvent(new Event('click'));
    expect(root.querySelector('#source').value).toBe('toon');
    expect(root.querySelector('#input').value).toContain('a[3]:');
    // sau swap, tab convert hiện JSON trở lại
    expect(root.querySelector('#output').textContent).toContain('"a"');
  });

  it('delimiter pipe ảnh hưởng output', () => {
    root.querySelector('#delimiter').value = 'pipe';
    typeInput(root, JSON.stringify({ a: [1, 2, 3] }));
    expect(root.querySelector('#output').textContent).toContain('1|2|3');
  });
});
