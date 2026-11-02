/** Portrait canvas used by vertical Shorts. Origin is the centre, y grows downwards. */
export const SHORT_SIZE = {w: 1080, h: 1920} as const;

/**
 * Screen zones for a 1080 x 1920 Short.
 *
 * `reservedBottom` is the Shorts app UI below the caption. `reservedCorner` is
 * the right-hand action rail, which starts at y = 0. Content must avoid both.
 */
export const SHORT_ZONES = {
  topBar: {x0: -540, x1: 540, y0: -930, y1: -850},
  main: {x0: -500, x1: 500, y0: -780, y1: 380},
  caption: {x0: -460, x1: 460, y0: 400, y1: 560},
  reservedBottom: {x0: -540, x1: 540, y0: 580, y1: 960},
  reservedCorner: {x0: 360, x1: 540, y0: 0, y1: 960},
} as const;

/**
 * Conservative rectangle for content that must stay clear of the Shorts UI.
 * The corner cut-out is narrower than this rectangle above y = 0, so lesson
 * layout tests still check `SHORT_ZONES.reservedCorner` separately.
 */
export const shortSafeBox = {x0: -540, x1: 540, y0: -930, y1: 560} as const;

/** Caption geometry: two lines at most, centred in the caption zone. */
export const SHORT_CAPTION = {
  x: 0,
  y: 470,
  width: 920,
  fontSize: 52,
  lineHeight: 64,
  maxLines: 2,
} as const;

/** Progress bar geometry: one thin segment per chapter. */
export const SHORT_PROGRESS = {x: 0, y: -860, width: 920, height: 8, gap: 10} as const;

/** Small title chip in the top bar. */
export const SHORT_TITLE = {x: -500, y: -894, fontSize: 20} as const;

/** Geometry shared by every progress segment. */
export interface ProgressSegments {
  /** X centre of the first segment. */
  startX: number;
  /** Centre-to-centre distance between segments. */
  step: number;
  /** Width of a finished or upcoming segment. */
  width: number;
  /** Width of the active segment. It grows into the gap but never overlaps. */
  activeWidth: number;
}

/**
 * Lay out one progress segment per chapter inside a bar.
 *
 * The active segment widens into the gaps, so an active first or last segment
 * still stays inside the bar. Pure: no Motion Canvas imports.
 *
 * @example
 * progressSegments(6, 920, 10); // {startX: -383.5, step: 153, width: 143, activeWidth: 153}
 */
export function progressSegments(count: number, barWidth: number, gap: number): ProgressSegments {
  if (!Number.isInteger(count) || count < 1) {
    throw new Error(`progressSegments needs a positive chapter count (got ${count})`);
  }
  if (barWidth <= 0 || gap < 0) {
    throw new Error('progressSegments needs a positive bar width and a non-negative gap');
  }

  const region = barWidth - gap;
  const width = Math.floor((region - (count - 1) * gap) / count);
  if (width < 1) {
    throw new Error(`progressSegments: ${count} chapters do not fit in a ${barWidth} px bar`);
  }

  return {
    startX: -region / 2 + width / 2,
    step: width + gap,
    width,
    activeWidth: width + gap,
  };
}

/** An axis-aligned box in scene coordinates. */
export interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** True when `inner` lies completely inside `outer`. */
export function boxInside(inner: Box, outer: Box): boolean {
  return inner.x0 >= outer.x0 && inner.x1 <= outer.x1 && inner.y0 >= outer.y0 && inner.y1 <= outer.y1;
}

/** True when two boxes share any area (touching edges do not count). */
export function boxIntersects(a: Box, b: Box): boolean {
  return a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
}
