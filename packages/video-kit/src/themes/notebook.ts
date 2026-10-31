import type {Theme} from './theme-types';

const SANS = '"Google Sans", "DM Sans", "Segoe UI", sans-serif';
const MONO = '"Roboto Mono", "SF Mono", Menlo, Consolas, monospace';
const STYLESHEET =
  'https://fonts.googleapis.com/css2?family=Google+Sans:wght@500;700&family=Roboto+Mono:wght@400;700&display=swap';

/**
 * Tonal surfaces, no outlines, rounded everything and a calm blue.
 *
 * @example
 * setActiveTheme('notebook', 'dark');
 */
export const notebookTheme: Theme = {
  id: 'notebook',
  name: 'Notebook',
  family: 'notebooklm',
  description: 'Soft tonal surfaces, no outlines, rounded everything, calm blue.',
  defaultMode: 'light',
  fonts: {
    sans: SANS,
    mono: MONO,
    display: SANS,
    stylesheet: STYLESHEET,
  },
  variants: {
    light: {
      colors: {
        bg: '#F8FAFD',
        grid: 'rgba(0,0,0,0)',
        surf: '#FFFFFF',
        surf2: '#E9EEF6',
        code: '#F0F4F9',
        ink: '#1F1F1F',
        onAccent: '#FFFFFF',
        border: '#C4C7C5',
        mute: '#444746',
        dim: '#C4C7C5',
        brand: '#0B57D0',
        onBrand: '#FFFFFF',
        lime: '#188038',
        pink: '#C2185B',
        cyan: '#00658B',
        yellow: '#B06000',
        violet: '#6750A4',
        orange: '#B04E00',
        red: '#B3261E',
        redBg: '#F9DEDC',
        limeBg: '#DDF3E4',
      },
      shape: {
        radiusScale: 1.7,
        borderWidthScale: 0,
        elevation: 'soft',
        elevationScale: 1,
      },
      hud: {
        gridSize: 60,
        gridVisible: false,
        captionStyle: 'tonal',
        captionLabel: null,
        titleStyle: 'plain',
      },
    },
    dark: {
      colors: {
        bg: '#131314',
        grid: 'rgba(0,0,0,0)',
        surf: '#1E1F20',
        surf2: '#282A2C',
        code: '#1B1B1D',
        ink: '#E3E3E3',
        onAccent: '#131314',
        border: '#444746',
        mute: '#C4C7C5',
        dim: '#444746',
        brand: '#A8C7FA',
        onBrand: '#062E6F',
        lime: '#81C995',
        pink: '#FF8BCB',
        cyan: '#78D9EC',
        yellow: '#FDD663',
        violet: '#D0BCFF',
        orange: '#FCAD70',
        red: '#F28B82',
        redBg: '#3C1F1E',
        limeBg: '#1C3224',
      },
      shape: {
        radiusScale: 1.7,
        borderWidthScale: 0,
        elevation: 'soft',
        elevationScale: 1,
      },
      hud: {
        gridSize: 60,
        gridVisible: false,
        captionStyle: 'tonal',
        captionLabel: null,
        titleStyle: 'plain',
      },
    },
  },
};
