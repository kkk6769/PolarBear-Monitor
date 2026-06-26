import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Lang, Translations } from './types';
import zh from './zh';
import en from './en';

const translations: Record<Lang, Translations> = { zh, en };

const I18nCtx = createContext<{ lang: Lang; t: Translations; setLang: (l: Lang) => void; available: Lang[] }>({
  lang: 'zh',
  t: zh,
  setLang: () => {},
  available: ['zh', 'en'],
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem('lang') as Lang) || 'zh';
  });

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem('lang', l);
  }, []);

  // Sync with localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('lang') as Lang | null;
    if (stored && stored !== lang && translations[stored]) {
      setLangState(stored);
    }
  }, []);

  const value = {
    lang,
    t: translations[lang],
    setLang,
    available: Object.keys(translations) as Lang[],
  };

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useT() {
  const ctx = useContext(I18nCtx);
  return {
    t: ctx.t,
    lang: ctx.lang,
    setLang: ctx.setLang,
    available: ctx.available,
  };
}
