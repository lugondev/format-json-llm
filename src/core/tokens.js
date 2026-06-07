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
