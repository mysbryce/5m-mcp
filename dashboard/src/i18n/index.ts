// Locale registry. Adding a language = drop a new `locales/<code>.json` file;
// Vite's import.meta.glob discovers it at build time. No code change needed.
// Each file must include a "_name" key for the language switcher label.

type Messages = Record<string, string>;

const modules = import.meta.glob<{ default: Messages }>('./locales/*.json', {
  eager: true,
});

export const locales: Record<string, Messages> = {};
for (const [path, mod] of Object.entries(modules)) {
  const code = path.match(/\/([^/]+)\.json$/)?.[1];
  if (code) locales[code] = mod.default;
}

export const availableLocales = Object.keys(locales).sort();
export const DEFAULT_LOCALE = availableLocales.includes('en') ? 'en' : (availableLocales[0] ?? 'en');

export function localeName(code: string): string {
  return locales[code]?._name ?? code;
}

export type { Messages };
