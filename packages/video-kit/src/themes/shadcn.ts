import type {Theme} from './theme-types';

const SANS = '"Inter", "Helvetica Neue", Arial, sans-serif';
const MONO = '"JetBrains Mono", "SF Mono", Menlo, Consolas, monospace';
const STYLESHEET =
  'https://fonts.googleapis.com/css2?family=Inter:wght@500;700&family=JetBrains+Mono:wght@400;700&display=swap';

/**
 * Zinc neutrals, hairline borders and a very light shadow: the quiet default.
 *
 * @example
 * setActiveTheme('shadcn', 'light');
 */
export const shadcnTheme: Theme = {
  id: 'shadcn',
  name: 'Shadcn',
  family: 'shadcn',
  description: 'Zinc neutrals, hairline borders, calm and clean.',
  defaultMode: 'dark',
  fonts: {
    sans: SANS,
    mono: MONO,
    display: SANS,
    stylesheet: STYLESHEET,
  },
  variants: {
    dark: {
      colors: {
        bg: '#09090B',
        grid: 'rgba(250,250,250,0.03)',
        surf: '#111113',
        surf2: '#27272A',
        code: '#0C0C0E',
        ink: '#FAFAFA',
        onAccent: '#09090B',
        border: '#3F3F46',
        mute: '#A1A1AA',
        dim: '#3F3F46',
        brand: '#FAFAFA',
        onBrand: '#18181B',
        lime: '#4ADE80',
        pink: '#F472B6',
        cyan: '#22D3EE',
        yellow: '#FACC15',
        violet: '#A78BFA',
        orange: '#FB923C',
        red: '#F87171',
        redBg: '#2A1517',
        limeBg: '#10261A',
      },
      shape: {
        radiusScale: 0.55,
        borderWidthScale: 0.4,
        elevation: 'none',
        elevationScale: 1,
      },
      hud: {
        gridSize: 60,
        gridVisible: false,
        captionStyle: 'outline',
        captionLabel: 'Note',
        titleStyle: 'plain',
      },
    },
    light: {
      colors: {
        bg: '#FFFFFF',
        grid: 'rgba(9,9,11,0.04)',
        surf: '#FFFFFF',
        surf2: '#F4F4F5',
        code: '#FAFAFA',
        ink: '#09090B',
        onAccent: '#FFFFFF',
        border: '#E4E4E7',
        mute: '#71717A',
        dim: '#D4D4D8',
        brand: '#18181B',
        onBrand: '#FAFAFA',
        lime: '#15803D',
        pink: '#BE185D',
        cyan: '#0E7490',
        yellow: '#A16207',
        violet: '#6D28D9',
        orange: '#C2410C',
        red: '#B91C1C',
        redBg: '#FEE2E2',
        limeBg: '#DCFCE7',
      },
      shape: {
        radiusScale: 0.55,
        borderWidthScale: 0.4,
        elevation: 'soft',
        elevationScale: 0.35,
      },
      hud: {
        gridSize: 60,
        gridVisible: false,
        captionStyle: 'outline',
        captionLabel: 'Note',
        titleStyle: 'plain',
      },
    },
  },
};
