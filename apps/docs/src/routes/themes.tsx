import {createFileRoute} from '@tanstack/react-router';
import {HomeLayout} from 'fumadocs-ui/layouts/home';
import {useEffect, useRef, useState, type KeyboardEvent, type ReactElement} from 'react';
import {VideoPlayer} from '@/components/video/video-player';
import {baseOptions} from '@/lib/layout.shared';
import {
  chaptersSnippet,
  configSnippet,
  listLooks,
  parseLookSearch,
  renderCommand,
  stepLook,
  type Look,
  type LookSelection,
} from '@/lib/looks';
import {pageTitle} from '@/lib/seo';
import {getStudioLesson} from '@/lib/studio-data';
import {themesJson, type ThemeEntry, type ThemeMode} from '@/lib/themes';

const SHOWCASE_SLUG = 'theme-showcase';
const MODES: ThemeMode[] = ['dark', 'light'];
const HEADER_DOTS = ['bg', 'surf', 'ink', 'brand', 'lime'] as const;
const MODE_LABEL: Record<ThemeMode, string> = {dark: 'Dark', light: 'Light'};

export const Route = createFileRoute('/themes')({
  validateSearch: (search: Record<string, unknown>) => {
    const validated: {theme?: string; mode?: ThemeMode; s?: number} = {};
    if (typeof search.theme === 'string') validated.theme = search.theme;
    if (search.mode === 'dark' || search.mode === 'light') validated.mode = search.mode;
    if (typeof search.s === 'string' && /^\d+$/.test(search.s)) validated.s = Number(search.s);
    return validated;
  },
  component: ThemesPage,
  head: () => ({
    meta: [
      {title: pageTitle('Themes gallery')},
      {name: 'description', content: 'Every video look, with a live preview of the theme-showcase lesson.'},
    ],
  }),
});

interface SnippetProps {
  id: string;
  title: string;
  code: string;
  copied: string | null;
  onCopy: (key: string, value: string) => Promise<void>;
}

function Snippet({id, title, code, copied, onCopy}: SnippetProps): ReactElement {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-fd-muted-foreground">{title}</p>
        <button
          type="button"
          data-copy-snippet={id}
          onClick={() => void onCopy(id, code)}
          className="rounded-md border border-fd-border bg-fd-secondary px-2 py-1 text-xs font-medium text-fd-secondary-foreground transition-colors hover:bg-fd-accent"
        >
          {copied === id ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="mt-1 max-w-full overflow-x-auto rounded-md border border-fd-border bg-fd-background p-2 text-xs leading-5">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function ThemeGroup({
  entry,
  selectedMode,
  selectedLook,
  onSelect,
}: {
  entry: ThemeEntry;
  selectedMode: ThemeMode;
  selectedLook: LookSelection;
  onSelect: (themeId: string, mode: ThemeMode) => void;
}): ReactElement {
  const headerColors = entry.variants[selectedMode].colors;

  return (
    <section
      className="border-b border-fd-border py-2 first:pt-0 last:border-b-0 last:pb-0"
      aria-labelledby={`theme-${entry.id}`}
    >
      <div className="flex items-center justify-between gap-2 px-2">
        <div className="min-w-0">
          <h2 id={`theme-${entry.id}`} className="truncate text-sm font-semibold">
            {entry.name}
          </h2>
          <p className="truncate text-xs text-fd-muted-foreground">{entry.family}</p>
        </div>
        <span className="flex shrink-0 items-center gap-1" aria-hidden="true">
          {HEADER_DOTS.map(key => (
            <span
              key={key}
              className="size-2.5 rounded-full border border-fd-border"
              style={{backgroundColor: headerColors[key]}}
            />
          ))}
        </span>
      </div>
      <div className="mt-1.5 grid gap-1">
        {MODES.map(mode => {
          const selected = selectedLook.themeId === entry.id && selectedLook.mode === mode;
          const colors = entry.variants[mode].colors;

          return (
            <button
              key={mode}
              type="button"
              data-look={`${entry.id}:${mode}`}
              aria-current={selected ? 'true' : undefined}
              aria-label={`${entry.name} ${MODE_LABEL[mode]}`}
              onClick={() => onSelect(entry.id, mode)}
              className={`flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left text-sm transition-colors hover:bg-fd-accent ${
                selected ? 'border-fd-primary bg-fd-accent' : 'border-transparent'
              }`}
            >
              <span
                className="relative block size-5 shrink-0 rounded border border-fd-border"
                style={{backgroundColor: colors.bg}}
                aria-hidden="true"
              >
                <span
                  className="absolute right-1 top-1 block size-2 rounded-full border border-fd-border"
                  style={{backgroundColor: colors.brand}}
                />
              </span>
              <span className="font-medium">{MODE_LABEL[mode]}</span>
              {entry.defaultMode === mode ? (
                <span className="ml-auto rounded-full border border-fd-border bg-fd-muted px-1.5 py-0.5 text-[10px] font-medium text-fd-muted-foreground">
                  default
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ThemesPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [look, setLook] = useState<LookSelection>(() => parseLookSearch(search, themesJson));
  const [autoPlay, setAutoPlay] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const current = useRef<LookSelection>(look);
  const keyboardMoved = useRef(false);

  useEffect(() => {
    const next = parseLookSearch({theme: search.theme, mode: search.mode, s: search.s}, themesJson);
    if (
      next.themeId === current.current.themeId &&
      next.mode === current.current.mode &&
      next.section === current.current.section
    ) {
      return;
    }

    current.current = next;
    setLook(next);
  }, [search.theme, search.mode, search.s]);

  useEffect(() => {
    const container = listRef.current;
    const selected = container?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!container || !selected) return;

    const containerRect = container.getBoundingClientRect();
    const selectedRect = selected.getBoundingClientRect();
    if (selectedRect.top < containerRect.top) {
      container.scrollTop -= containerRect.top - selectedRect.top;
    } else if (selectedRect.bottom > containerRect.bottom) {
      container.scrollTop += selectedRect.bottom - containerRect.bottom;
    }

    if (keyboardMoved.current) {
      keyboardMoved.current = false;
      selected.focus({preventScroll: true});
    }
  }, [look.themeId, look.mode, look.section]);

  function selectLook(next: LookSelection) {
    current.current = next;
    setLook(next);
    setAutoPlay(true);
    setCopied(null);
    void navigate({search: {theme: next.themeId, mode: next.mode, s: next.section}, replace: true});
  }

  function chooseLook(themeId: string, mode: ThemeMode) {
    selectLook({themeId, mode, section: current.current.section});
  }

  function chooseSection(section: number) {
    selectLook({themeId: current.current.themeId, mode: current.current.mode, section});
  }

  function move(direction: 1 | -1) {
    const next = stepLook(listLooks(themesJson), current.current, direction);
    selectLook({...next, section: current.current.section});
  }

  function onListKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();

    const looks = listLooks(themesJson);
    const base = current.current;
    let next: Look;
    if (event.key === 'Home') next = looks[0];
    else if (event.key === 'End') next = looks[looks.length - 1];
    else next = stepLook(looks, base, event.key === 'ArrowDown' ? 1 : -1);

    keyboardMoved.current = true;
    selectLook({...next, section: base.section});
  }

  async function copy(key: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
    } catch {
      // Clipboard access can be denied; the text stays visible on the page.
    }
  }

  const theme = themesJson.themes.find(item => item.id === look.themeId) ?? themesJson.themes[0];
  const variant = theme.variants[look.mode];
  const chapters = getStudioLesson(SHOWCASE_SLUG)?.chapters ?? [];

  return (
    <HomeLayout {...baseOptions()}>
      <div className="mx-auto w-full max-w-7xl px-4 pb-12 pt-8 sm:px-6">
        <header className="max-w-3xl">
          <p className="text-sm font-medium text-fd-muted-foreground">Motion Studio</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Themes gallery</h1>
          <p className="mt-3 text-fd-muted-foreground">
            Click a look to preview the theme-showcase lesson in it. The video look is independent of the docs
            light/dark toggle; the toggle only changes these docs.
          </p>
        </header>

        <div className="mt-8 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:items-start">
          <aside
            ref={listRef}
            onKeyDown={onListKeyDown}
            aria-label="Video looks"
            data-look-list=""
            className="order-2 min-w-0 rounded-lg border border-fd-border bg-fd-card p-2 lg:order-1 lg:sticky lg:top-0 lg:max-h-[calc(100vh_-_1rem)] lg:overflow-y-auto"
          >
            {themesJson.themes.map(entry => (
              <ThemeGroup
                key={entry.id}
                entry={entry}
                selectedMode={look.mode}
                selectedLook={look}
                onSelect={chooseLook}
              />
            ))}
          </aside>

          <div className="order-1 min-w-0 lg:order-2 lg:sticky lg:top-0 lg:max-h-[calc(100vh_-_1rem)] lg:overflow-y-auto lg:pb-4">
            <h2 className="text-lg font-semibold tracking-tight">
              Video look: {theme.name} / {MODE_LABEL[look.mode]}
            </h2>
            <p className="mt-0.5 text-xs text-fd-muted-foreground">Independent of the docs light/dark toggle.</p>

            <div className="mt-3">
              <VideoPlayer
                slug={SHOWCASE_SLUG}
                startSection={look.section}
                theme={look.themeId}
                mode={look.mode}
                autoPlay={autoPlay}
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                data-look-step="previous"
                onClick={() => move(-1)}
                className="rounded-md border border-fd-border bg-fd-secondary px-3 py-1.5 text-xs font-medium text-fd-secondary-foreground transition-colors hover:bg-fd-accent"
              >
                Previous look
              </button>
              <button
                type="button"
                data-look-step="next"
                onClick={() => move(1)}
                className="rounded-md border border-fd-border bg-fd-secondary px-3 py-1.5 text-xs font-medium text-fd-secondary-foreground transition-colors hover:bg-fd-accent"
              >
                Next look
              </button>
              <span className="text-xs text-fd-muted-foreground" aria-live="polite">
                Chapter {look.section + 1} of {chapters.length || 6}
              </span>
            </div>

            {chapters.length ? (
              <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Showcase chapters">
                {chapters.map((chapter, index) => {
                  const active = index === look.section;

                  return (
                    <button
                      key={`${index}-${chapter.name}`}
                      type="button"
                      data-chapter-index={index}
                      aria-current={active ? 'true' : undefined}
                      onClick={() => chooseSection(index)}
                      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-fd-accent ${
                        active
                          ? 'border-fd-primary bg-fd-accent text-fd-accent-foreground'
                          : 'border-fd-border bg-fd-card'
                      }`}
                    >
                      <span className="font-mono text-[10px] text-fd-muted-foreground">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      {chapter.name}
                    </button>
                  );
                })}
              </div>
            ) : null}

            <section className="mt-4 rounded-lg border border-fd-border bg-fd-card p-3" aria-labelledby="look-details">
              <h3 id="look-details" className="text-sm font-semibold">
                Look details
              </h3>
              <p className="mt-1 text-sm text-fd-muted-foreground">{theme.description}</p>

              <dl className="mt-3 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-xs text-fd-muted-foreground">Display font</dt>
                  <dd className="font-medium">{theme.fonts.display}</dd>
                </div>
                <div>
                  <dt className="text-xs text-fd-muted-foreground">Sans font</dt>
                  <dd className="font-medium">{theme.fonts.sans}</dd>
                </div>
                <div>
                  <dt className="text-xs text-fd-muted-foreground">Mono font</dt>
                  <dd className="font-medium">{theme.fonts.mono}</dd>
                </div>
              </dl>

              <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <div className="rounded-md border border-fd-border bg-fd-background p-2">
                  <p className="text-xs font-medium text-fd-muted-foreground">Shape</p>
                  <p className="mt-1">
                    Radius ×{variant.shape.radiusScale} · border ×{variant.shape.borderWidthScale} · elevation{' '}
                    {variant.shape.elevation}
                  </p>
                </div>
                <div className="rounded-md border border-fd-border bg-fd-background p-2">
                  <p className="text-xs font-medium text-fd-muted-foreground">HUD</p>
                  <p className="mt-1">
                    Caption {variant.hud.captionStyle} · title {variant.hud.titleStyle} · grid{' '}
                    {variant.hud.gridVisible ? 'on' : 'off'}
                  </p>
                </div>
              </div>

              <table className="mt-3 w-full table-fixed border-collapse text-left text-xs">
                <caption className="pb-1 text-left text-xs font-medium text-fd-muted-foreground">Colours</caption>
                <thead>
                  <tr className="text-fd-muted-foreground">
                    <th className="w-24 py-1 font-medium">Token</th>
                    <th className="w-8 py-1 font-medium">
                      <span className="sr-only">Swatch</span>
                    </th>
                    <th className="py-1 font-medium">Hex</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(variant.colors).map(([name, value]) => (
                    <tr key={name} className="border-t border-fd-border">
                      <td className="py-1 font-mono">{name}</td>
                      <td className="py-1">
                        <span
                          className="block size-4 rounded-sm border border-fd-border"
                          style={{backgroundColor: value}}
                          aria-hidden="true"
                        />
                      </td>
                      <td className="py-1">
                        <button
                          type="button"
                          onClick={() => void copy(`hex:${name}`, value)}
                          title={`Copy ${value}`}
                          className="inline-flex max-w-full items-center gap-2 font-mono text-fd-muted-foreground hover:text-fd-foreground"
                        >
                          <span className="break-all">{value}</span>
                          {copied === `hex:${name}` ? <span className="shrink-0 text-fd-primary">copied</span> : null}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="mt-4 rounded-lg border border-fd-border bg-fd-card p-3" aria-labelledby="use-look">
              <h3 id="use-look" className="text-sm font-semibold">
                Use this look
              </h3>
              <div className="mt-2 space-y-3">
                <Snippet id="command" title="Terminal" code={renderCommand(look)} copied={copied} onCopy={copy} />
                <Snippet
                  id="chapters"
                  title="chapters.json"
                  code={chaptersSnippet(look)}
                  copied={copied}
                  onCopy={copy}
                />
                <Snippet
                  id="config"
                  title="video.config.json"
                  code={configSnippet(look)}
                  copied={copied}
                  onCopy={copy}
                />
              </div>
            </section>
          </div>
        </div>
      </div>
    </HomeLayout>
  );
}
