import type {Theme} from './theme-types';

const SANS = '"Inter", "Helvetica Neue", Arial, sans-serif';
const MONO = '"JetBrains Mono", "SF Mono", Menlo, Consolas, monospace';
const STYLESHEET =
  'https://fonts.googleapis.com/css2?family=Inter:wght@500;700&family=JetBrains+Mono:wght@400;700&display=swap';

/**
 * The popular editor palette, with a day version for bright rooms.
 *
 * @example
 * setActiveTheme('tokyo-night', 'light');
 */
export const tokyoNightTheme: Theme = {
  id: 'tokyo-night',
  name: 'Tokyo Night',
  family: 'dev',
  description: 'The popular editor palette; ideal for code-heavy videos. Light mode follows the Tokyo Night Day idea.',
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
        bg: '#1A1B26',
        grid: 'rgba(192,202,245,0.04)',
        surf: '#1F2335',
        surf2: '#292E42',
        code: '#16161E',
        ink: '#C0CAF5',
        onAccent: '#16161E',
        border: '#3B4261',
        mute: '#8089B3',
        dim: '#3B4261',
        brand: '#7AA2F7',
        onBrand: '#16161E',
        lime: '#9ECE6A',
        pink: '#F7768E',
        cyan: '#7DCFFF',
        yellow: '#E0AF68',
        violet: '#BB9AF7',
        orange: '#FF9E64',
        red: '#DB4B4B',
        redBg: '#2D1F2A',
        limeBg: '#1F2D26',
      },
      shape: {
        radiusScale: 0.8,
        borderWidthScale: 0.45,
        elevation: 'none',
        elevationScale: 1,
      },
      hud: {
        gridSize: 60,
        gridVisible: true,
        captionStyle: 'outline',
        captionLabel: 'NOTE',
        titleStyle: 'plain',
      },
    },
    light: {
      colors: {
        bg: '#E6E7ED',
        grid: 'rgba(52,59,88,0.05)',
        surf: '#F4F5F9',
        surf2: '#D6D8E3',
        code: '#EDEEF4',
        ink: '#343B58',
        onAccent: '#FFFFFF',
        border: '#A8AECB',
        mute: '#5F6A9C',
        dim: '#C5C8DA',
        brand: '#2E5DB8',
        onBrand: '#FFFFFF',
        lime: '#4F7A1F',
        pink: '#B0305F',
        cyan: '#0F6E8C',
        yellow: '#8C6C3E',
        violet: '#7847BD',
        orange: '#B15C00',
        red: '#C64343',
        redBg: '#F3DADF',
        limeBg: '#DFEBD6',
      },
      shape: {
        radiusScale: 0.8,
        borderWidthScale: 0.45,
        elevation: 'none',
        elevationScale: 1,
      },
      hud: {
        gridSize: 60,
        gridVisible: true,
        captionStyle: 'outline',
        captionLabel: 'NOTE',
        titleStyle: 'plain',
      },
    },
  },
};
