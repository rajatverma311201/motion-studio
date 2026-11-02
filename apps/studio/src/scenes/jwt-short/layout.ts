/** Screen zones for the 1080 x 1920 Short. Origin is the centre, y grows downwards. */
export const SHORT = {w: 1080, h: 1920} as const;

export const ZONES = {
  topBar: {x0: -540, x1: 540, y0: -930, y1: -850},
  main: {x0: -500, x1: 500, y0: -780, y1: 380},
  caption: {x0: -460, x1: 460, y0: 400, y1: 560},
  reservedBottom: {x0: -540, x1: 540, y0: 580, y1: 960},
  reservedCorner: {x0: 360, x1: 540, y0: 0, y1: 960},
} as const;

/** A centre-plus-size rectangle in scene coordinates. */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const box = (x: number, y: number, w: number, h: number): Box => ({x, y, w, h});

/** HOOK: the full token types in near the top of the main zone. */
export const HOOK = {
  strip: box(0, -610, 920, 270),
  jwtChip: box(0, -330, 280, 90),
  fullNameChip: box(0, -210, 360, 60),
};

/** PARTS: the strip stays high and three chips pop beneath it. */
export const PARTS = {
  strip: box(0, -600, 920, 270),
  header: box(-320, -330, 200, 60),
  payload: box(0, -330, 220, 60),
  signature: box(320, -330, 260, 60),
};

/** READABLE: strip on top, two JSON cards, a Base64URL arrow and a red stamp. */
export const READABLE = {
  strip: box(0, -645, 920, 270),
  headerCard: box(-250, -245, 400, 252),
  payloadCard: box(250, -210, 430, 366),
  base64Label: box(170, -455, 200, 50),
  stamp: box(0, 120, 430, 110),
};

/** SIGNATURE: the HMAC machine. Shifted left so its right edge clears the action rail. */
export const SIGNATURE = {
  machine: box(-80, -100, 720, 440),
};

/** TAMPER: small strip, payload card, machine, comparison chips and the INVALID stamp. */
export const TAMPER = {
  strip: box(0, -700, 920, 120),
  payloadCard: box(0, -410, 460, 366),
  machine: box(-80, 80, 720, 360),
  originalChip: box(-280, -160, 360, 54),
  newChip: box(160, -160, 360, 54),
  stamp: box(-250, 320, 340, 100),
};

/** TAKEAWAY: two statement chips and the muted channel chip. */
export const TAKEAWAY = {
  signed: box(0, -330, 520, 90),
  noPasswords: box(0, -170, 740, 90),
  channel: box(0, 20, 700, 60),
};
