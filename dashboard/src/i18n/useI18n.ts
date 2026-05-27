import { computed, ref } from 'vue';
import { DEFAULT_LOCALE, availableLocales, localeName, locales } from './index';

const STORAGE_KEY = 'agent_api_locale';

function detectInitial(): string {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && availableLocales.includes(stored)) return stored;
  const nav = navigator.language?.slice(0, 2).toLowerCase();
  if (nav && availableLocales.includes(nav)) return nav;
  return DEFAULT_LOCALE;
}

const locale = ref(detectInitial());
if (typeof document !== 'undefined') document.documentElement.lang = locale.value;

type Vars = Record<string, string | number>;

export function useI18n() {
  function t(key: string, vars?: Vars): string {
    const msg = locales[locale.value]?.[key] ?? locales[DEFAULT_LOCALE]?.[key] ?? key;
    if (!vars) return msg;
    return msg.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? ''));
  }

  function setLocale(code: string): void {
    if (!availableLocales.includes(code)) return;
    locale.value = code;
    localStorage.setItem(STORAGE_KEY, code);
    document.documentElement.lang = code;
  }

  const options = computed(() => availableLocales.map((code) => ({ code, name: localeName(code) })));

  return { locale, t, setLocale, options };
}
