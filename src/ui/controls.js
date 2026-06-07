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
