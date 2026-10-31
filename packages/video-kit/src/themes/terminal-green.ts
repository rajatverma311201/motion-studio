import type {Theme} from './theme-types';

const MONO = '"JetBrains Mono", "SF Mono", Menlo, Consolas, monospace';
const STYLESHEET = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap';

/**
 * Phosphor green on near-black with a soft glow; the light mode is green ink on pale paper.
 *
 * @example
 * setActiveTheme('terminal-green', 'dark');
 */
export const terminalGreenTheme: Theme = {
  id: 'terminal-green',
  name: 'Terminal Green',
  family: 'dev',
  description: 'Phosphor green on near-black with a soft glow; light mode is green ink on pale paper.',
  defaultMode: 'dark',
  fonts: {
    sans: MONO,
    mono: MONO,
    display: MONO,
    stylesheet: STYLESHEET,
  },
  variants: {
    dark: {
      colors: {
        bg: '#050A06',
        grid: 'rgba(57,255,106,0.06)',
        surf: '#0A140C',
        surf2: '#102016',
        code: '#050A06',
        ink: '#B9F5C2',
        onAccent: '#050A06',
        border: '#1F6B35',
        mute: '#5FA36E',
        dim: '#1A3B24',
        brand: '#39FF6A',
        onBrand: '#050A06',
        lime: '#39FF6A',
        pink: '#FF5FA2',
        cyan: '#37E6D0',
        yellow: '#E6E637',
        violet: '#9D8CFF',
        orange: '#FFA640',
        red: '#FF4B4B',
        redBg: '#2A0F0F',
        limeBg: '#0F2A16',
      },
      shape: {
        radiusScale: 0.2,
        borderWidthScale: 0.6,
        elevation: 'glow',
        elevationScale: 1,
      },
      hud: {
        gridSize: 60,
        gridVisible: true,
        captionStyle: 'outline',
        captionLabel: '>_',
        titleStyle: 'plain',
      },
    },
    light: {
      colors: {
        bg: '#F2F7EE',
        grid: 'rgba(21,122,53,0.08)',
        surf: '#FFFFFF',
        surf2: '#E1EDDA',
        code: '#EAF3E4',
        ink: '#0F3B1C',
        onAccent: '#FFFFFF',
        border: '#2E7D46',
        mute: '#4F7A5A',
        dim: '#C3D8BE',
        brand: '#157A35',
        onBrand: '#FFFFFF',
        lime: '#1B7F3A',
        pink: '#B3246A',
        cyan: '#0E7C72',
        yellow: '#8A6A00',
        violet: '#5B3FB0',
        orange: '#B14F00',
        red: '#B3261E',
        redBg: '#F8DCDC',
        limeBg: '#D8EEDD',
      },
      shape: {
        radiusScale: 0.2,
        borderWidthScale: 0.6,
        elevation: 'none',
        elevationScale: 1,
      },
      hud: {
        gridSize: 60,
        gridVisible: true,
        captionStyle: 'outline',
        captionLabel: '>_',
        titleStyle: 'plain',
      },
    },
  },
};
