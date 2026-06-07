import { encode, decode, ToonDecodeError } from '@toon-format/toon';

export function jsonToToon(jsonString, opts = {}) {
  let value;
  try {
    value = JSON.parse(jsonString);
  } catch (e) {
    return { ok: false, toon: '', error: `Invalid JSON: ${e.message}` };
  }
  try {
    const toon = encode(value, opts);
    return { ok: true, toon, error: null };
  } catch (e) {
    return { ok: false, toon: '', error: `TOON encode error: ${e.message}` };
  }
}

export function toonToJson(toonString, opts = {}) {
  try {
    const value = decode(toonString, opts);
    return { ok: true, json: JSON.stringify(value, null, 2), value, error: null };
  } catch (e) {
    const msg = e instanceof ToonDecodeError ? e.message : String(e?.message ?? e);
    return { ok: false, json: '', value: undefined, error: `TOON decode error: ${msg}` };
  }
}
