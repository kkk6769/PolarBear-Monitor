const cache = new Map<string, string>();

export function getLocalizedCountry(code: string, lang: string): string {
  const cacheKey = `${code}-${lang}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  try {
    const locale = lang === 'zh' ? 'zh-CN' : 'en-US';
    const names = new Intl.DisplayNames([locale], { type: 'region' });
    const name = names.of(code.toUpperCase());
    if (name) {
      cache.set(cacheKey, name);
      return name;
    }
  } catch {
    // fall through
  }
  return code; // fallback to code itself
}
