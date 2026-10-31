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
    <div className="nb-theme-swatches">
      {MODES.map(mode => (
        <section className="nb-theme-swatch-row" key={mode}>
          <h3 className="nb-theme-swatch-title">
            {entry.name} / {mode}
            {entry.defaultMode === mode ? <span className="nb-theme-swatch-default"> default</span> : null}
          </h3>
          <div className="nb-swatches">
            {Object.entries(entry.variants[mode].colors).map(([name, value]) => (
              <div className="nb-swatch" key={name}>
                <span className="nb-swatch-color" aria-hidden="true">
                  <span className="nb-swatch-fill" style={{backgroundColor: value}} />
                </span>
                <span className="nb-swatch-name">{name}</span>
                <code className="nb-swatch-value">{value}</code>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
