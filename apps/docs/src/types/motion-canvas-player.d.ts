import type {DetailedHTMLProps, HTMLAttributes} from 'react';

interface MotionCanvasPlayerAttributes extends HTMLAttributes<HTMLElement> {
  src?: string;
  width?: number;
  height?: number;
  auto?: boolean | string;
  quality?: number;
  variables?: string;
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'motion-canvas-player': DetailedHTMLProps<MotionCanvasPlayerAttributes, HTMLElement>;
    }
  }
}
