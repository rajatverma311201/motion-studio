import type {ReactElement} from 'react';
import themesData from '@/generated/themes.json';

type ThemeMode = 'dark' | 'light';

interface ThemeEntry {
  id: string;
  name: string;
  defaultMode: ThemeMode;
  variants: Record<ThemeMode, {colors: Record<string, string>}>;
}

const data = themesData as {defaultThemeId: string; themes: ThemeEntry[]};
const MODES: ThemeMode[] = ['dark', 'light'];

interface ColorSwatchesProps {
  /** Theme id, e.g. "tokyo-night". Defaults to `neubrutal`. */
  theme?: string;
}

/** Dark and light colour rows for one theme, read from the generated theme data. */
export function ColorSwatches({theme = 'neubrutal'}: ColorSwatchesProps): ReactElement {
  const entry =
    data.themes.find(item => item.id === theme) ?? data.themes.find(item => item.id === data.defaultThemeId);
  if (!entry) {
    return (
      <p>
        No theme data. Run <code>pnpm sync:themes</code> in the repo root.
      </p>
    );
  }

  return (
    <div className="my-6 space-y-6">
      {MODES.map(mode => (
        <section key={mode}>
          <h3 className="mb-3 text-sm font-semibold">
            {entry.name} / {mode}
            {entry.defaultMode === mode ? (
              <span className="ml-2 rounded-full border border-fd-border bg-fd-muted px-2 py-0.5 text-xs font-medium text-fd-muted-foreground">
                default
              </span>
            ) : null}
          </h3>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-3">
            {Object.entries(entry.variants[mode].colors).map(([name, value]) => (
              <div key={name} className="flex flex-col gap-2 rounded-lg border border-fd-border bg-fd-card p-2">
                <span
                  className="block h-16 rounded-md border border-fd-border"
                  style={{backgroundColor: value}}
                  aria-hidden="true"
                />
                <span className="font-mono text-xs font-medium">{name}</span>
                <code className="text-xs text-fd-muted-foreground">{value}</code>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
