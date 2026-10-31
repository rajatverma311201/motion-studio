import type {Theme} from './theme-types';

const SANS = '"IBM Plex Sans", "Segoe UI", sans-serif';
const MONO = '"IBM Plex Mono", "SF Mono", Menlo, Consolas, monospace';
const STYLESHEET =
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@500;600;700&family=IBM+Plex+Mono:wght@400;700&display=swap';

/**
 * Drafting-paper look with a strong grid; light mode is a white-print.
 *
 * @example
 * setActiveTheme('blueprint', 'light');
 */
export const blueprintTheme: Theme = {
  id: 'blueprint',
  name: 'Blueprint',
  family: 'dev',
  description: 'Drafting-paper look with a strong grid; light mode is a white-print.',
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
        bg: '#0B2545',
        grid: 'rgba(141,169,196,0.20)',
        surf: '#13315C',
        surf2: '#1B4079',
        code: '#0A2240',
        ink: '#EEF4ED',
        onAccent: '#0B2545',
        border: '#8DA9C4',
        mute: '#A9BFD6',
        dim: '#2B4C7E',
        brand: '#FFE066',
        onBrand: '#0B2545',
        lime: '#B8F2A0',
        pink: '#FF9EBB',
        cyan: '#7BDFF2',
        yellow: '#FFE066',
        violet: '#B8A1FF',
        orange: '#FFB26B',
        red: '#FF7F7F',
        redBg: '#3A2538',
        limeBg: '#1E4A45',
      },
      shape: {
        radiusScale: 0.4,
        borderWidthScale: 0.5,
        elevation: 'none',
        elevationScale: 1,
      },
      hud: {
        gridSize: 30,
        gridVisible: true,
        captionStyle: 'outline',
        captionLabel: 'NOTE',
        titleStyle: 'plain',
      },
    },
    light: {
      colors: {
        bg: '#F3F7FB',
        grid: 'rgba(20,60,110,0.14)',
        surf: '#FFFFFF',
        surf2: '#E3ECF6',
        code: '#EAF1F9',
        ink: '#0B2545',
        onAccent: '#FFFFFF',
        border: '#2B5C9A',
        mute: '#44638A',
        dim: '#B9CCE0',
        brand: '#0B4FA8',
        onBrand: '#FFFFFF',
        lime: '#1E7A3C',
        pink: '#B3246A',
        cyan: '#00708F',
        yellow: '#8F6200',
        violet: '#5B3FB0',
        orange: '#B14A00',
        red: '#B3261E',
        redBg: '#F8DCDC',
        limeBg: '#DAF0E0',
      },
      shape: {
        radiusScale: 0.4,
        borderWidthScale: 0.5,
        elevation: 'none',
        elevationScale: 1,
      },
      hud: {
        gridSize: 30,
        gridVisible: true,
        captionStyle: 'outline',
        captionLabel: 'NOTE',
        titleStyle: 'plain',
      },
    },
  },
};
