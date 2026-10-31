import type {Theme} from './theme-types';

const SANS = '"Space Grotesk", Inter, "Segoe UI", sans-serif';
const MONO = '"JetBrains Mono", "SF Mono", Menlo, Consolas, monospace';
const STYLESHEET =
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=JetBrains+Mono:wght@400;700&display=swap';

/**
 * The original dark neubrutalism look, plus its light variant.
 *
 * @example
 * setActiveTheme(neubrutalTheme.id);
 */
export const neubrutalTheme: Theme = {
  id: 'neubrutal',
  name: 'Neubrutal',
  family: 'neubrutal',
  description: 'Thick borders, hard offset shadows, punchy accents.',
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
        bg: '#0B0B10',
        grid: 'rgba(255,255,255,0.045)',
        surf: '#15151D',
        surf2: '#1F1F2B',
        code: '#0F0F16',
        ink: '#F4F1EA',
        onAccent: '#0B0B10',
        border: '#F4F1EA',
        mute: '#9A99A8',
        dim: '#3A3950',
        brand: '#C6FF3D',
        onBrand: '#0B0B10',
        lime: '#C6FF3D',
        pink: '#FF4D8D',
        cyan: '#3DE3FF',
        yellow: '#FFD23D',
        violet: '#9B7BFF',
        orange: '#FF8A3D',
        red: '#FF4D4D',
        redBg: '#3A1521',
        limeBg: '#18301C',
      },
      shape: {
        radiusScale: 1,
        borderWidthScale: 1,
        elevation: 'hard',
        elevationScale: 1,
      },
      hud: {
        gridSize: 60,
        gridVisible: true,
        captionStyle: 'bar',
        captionLabel: 'NOTE',
        titleStyle: 'slab',
      },
    },
    light: {
      colors: {
        bg: '#F4F1EA',
        grid: 'rgba(11,11,16,0.06)',
        surf: '#FFFFFF',
        surf2: '#ECE7D8',
        code: '#FFFDF7',
        ink: '#0B0B10',
        onAccent: '#FFFFFF',
        border: '#0B0B10',
        mute: '#5E5C68',
        dim: '#CFC9B6',
        brand: '#0B0B10',
        onBrand: '#F4F1EA',
        lime: '#15803D',
        pink: '#BE185D',
        cyan: '#0E7490',
        yellow: '#A16207',
        violet: '#6D28D9',
        orange: '#C2410C',
        red: '#B91C1C',
        redBg: '#F8D9D9',
        limeBg: '#D9F0DF',
      },
      shape: {
        radiusScale: 1,
        borderWidthScale: 1,
        elevation: 'hard',
        elevationScale: 1,
      },
      hud: {
        gridSize: 60,
        gridVisible: true,
        captionStyle: 'bar',
        captionLabel: 'NOTE',
        titleStyle: 'slab',
      },
    },
  },
};
