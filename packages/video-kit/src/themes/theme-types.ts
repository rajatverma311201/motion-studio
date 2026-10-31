export type AccentSlot = 'lime' | 'pink' | 'cyan' | 'yellow' | 'violet' | 'orange' | 'red';
export type ElevationStyle = 'hard' | 'soft' | 'glow' | 'none';
export type CaptionStyle = 'bar' | 'tonal' | 'outline';
export type TitleStyle = 'slab' | 'plain' | 'pill';

/** Accent slots are SEMANTIC slots, not literal hues: lime = positive / primary highlight, red = danger,
 *  cyan = info, yellow = warning / focus, pink = secondary highlight, violet = structure, orange = attention. */
export interface ThemeColors {
  bg: string;
  grid: string;
  surf: string;
  surf2: string;
  code: string;
  ink: string; // main text
  onAccent: string; // text drawn ON an accent-coloured fill
  border: string; // outline colour of boxes
  mute: string; // secondary text
  dim: string; // subtle lines, disabled
  brand: string; // chrome accent: HUD logo, caption label, title slab
  onBrand: string; // text on brand fill
  lime: string;
  pink: string;
  cyan: string;
  yellow: string;
  violet: string;
  orange: string;
  red: string;
  redBg: string; // tinted background for "bad" rows
  limeBg: string; // tinted background for "good" rows
}

export interface ThemeShape {
  radiusScale: number; // multiplies every radius literal (1 = today's look); values >= 100 (pills) are not scaled
  borderWidthScale: number; // multiplies border widths; 0 = no borders; otherwise never below 1.5 px
  elevation: ElevationStyle; // hard offset | soft blurred | accent glow | none
  elevationScale: number; // multiplies shadow offset / blur
}

export interface ThemeHud {
  gridSize: number; // background grid spacing (today 60)
  gridVisible: boolean;
  captionStyle: CaptionStyle;
  captionLabel: string | null; // text of the little label in the caption bar (today "NOTE"); null hides it
  titleStyle: TitleStyle;
}

export interface ThemeFonts {
  sans: string; // CSS font-family stack for text
  mono: string; // CSS stack for labels and code; MUST have a 0.6 em advance (the code grid depends on it)
  display: string; // titles; may equal sans
  stylesheet: string; // one Google Fonts CSS URL that loads all families used
}

export type ThemeMode = 'dark' | 'light';

/** Everything that differs between the dark and the light version of one theme. */
export interface ThemeVariant {
  colors: ThemeColors;
  shape: ThemeShape;
  hud: ThemeHud;
}

/** A design language. Both modes are mandatory; fonts are shared by both. */
export interface Theme {
  id: string; // kebab-case, equals the file name
  name: string; // "Neubrutal"
  family: string; // "neubrutal" | "shadcn" | "notebooklm" | "dev" | "editorial"
  description: string; // one sentence for the docs catalogue
  defaultMode: ThemeMode; // used when nothing else picks a mode
  fonts: ThemeFonts;
  variants: Record<ThemeMode, ThemeVariant>;
}

/** What the kit reads at call time: one theme flattened to one mode. */
export interface ResolvedTheme extends ThemeVariant {
  id: string;
  name: string;
  mode: ThemeMode;
  fonts: ThemeFonts;
}
