import type {Theme} from './theme-types';

const SANS = '"Inter", "Helvetica Neue", Arial, sans-serif';
const MONO = '"JetBrains Mono", "SF Mono", Menlo, Consolas, monospace';
const DISPLAY = '"Fraunces", Georgia, serif';
const STYLESHEET =
  'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700&family=Inter:wght@500;700&family=JetBrains+Mono:wght@400;700&display=swap';

/**
 * Warm paper, ink rules and one editorial red; a serif for titles.
 *
 * @example
 * setActiveTheme('paper-editorial', 'dark');
 */
export const paperEditorialTheme: Theme = {
  id: 'paper-editorial',
  name: 'Paper Editorial',
  family: 'editorial',
  description:
    'Warm paper, ink rules and one editorial red; a serif for titles. Dark mode is the same page after dusk.',
  defaultMode: 'light',
  fonts: {
    sans: SANS,
    mono: MONO,
    display: DISPLAY,
    stylesheet: STYLESHEET,
  },
  variants: {
    light: {
      colors: {
        bg: '#FBF7EE',
        grid: 'rgba(0,0,0,0)',
        surf: '#FFFFFF',
        surf2: '#F1EADB',
        code: '#FFFDF8',
        ink: '#1B1A17',
        onAccent: '#FFFDF8',
        border: '#1B1A17',
        mute: '#6B665A',
        dim: '#D9D0BC',
        brand: '#B5341F',
        onBrand: '#FFFDF8',
        lime: '#2F6B3A',
        pink: '#A8305E',
        cyan: '#1F5F7A',
        yellow: '#8A6410',
        violet: '#5B3E91',
        orange: '#B2561A',
        red: '#B5341F',
        redBg: '#F6DAD3',
        limeBg: '#DDEBD9',
      },
      shape: {
        radiusScale: 0.3,
        borderWidthScale: 0.45,
        elevation: 'none',
        elevationScale: 1,
      },
      hud: {
        gridSize: 60,
        gridVisible: false,
        captionStyle: 'outline',
        captionLabel: null,
        titleStyle: 'plain',
      },
    },
    dark: {
      colors: {
        bg: '#161512',
        grid: 'rgba(0,0,0,0)',
        surf: '#1F1D19',
        surf2: '#2A2722',
        code: '#12110F',
        ink: '#F2EBDD',
        onAccent: '#161512',
        border: '#D9CFB8',
        mute: '#A89F8B',
        dim: '#3A362E',
        brand: '#E8643F',
        onBrand: '#161512',
        lime: '#8FC98F',
        pink: '#E88AAE',
        cyan: '#7CC4DE',
        yellow: '#E0B656',
        violet: '#B79CEB',
        orange: '#EE9A5C',
        red: '#E8643F',
        redBg: '#38201B',
        limeBg: '#1F2D1F',
      },
      shape: {
        radiusScale: 0.3,
        borderWidthScale: 0.45,
        elevation: 'none',
        elevationScale: 1,
      },
      hud: {
        gridSize: 60,
        gridVisible: false,
        captionStyle: 'outline',
        captionLabel: null,
        titleStyle: 'plain',
      },
    },
  },
};
