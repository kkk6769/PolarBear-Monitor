import { useT } from '../i18n';
import type { Lang } from '../i18n/types';

const labels: Record<Lang, string> = { zh: '中', en: 'EN' };

export default function LanguageSwitcher() {
  const { lang, setLang, available } = useT();

  return (
    <span className="inline-flex rounded-full bg-card ring-1 ring-border overflow-hidden">
      {available.map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-2 py-0.5 text-[11px] font-medium transition-colors ${
            lang === l
              ? 'bg-[#00D4FF]/15 text-[#00D4FF]'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {labels[l]}
        </button>
      ))}
    </span>
  );
}
