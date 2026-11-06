/** Screen zones for the 1080 x 1920 Short. Origin is the centre, y grows downwards. */
export const SHORT = {w: 1080, h: 1920} as const;

/**
 * The step 21 Short zones, mirrored here so the Node layout test does not load
 * the Motion Canvas barrel. Keep these values in sync with `SHORT_ZONES` in the kit.
 */
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

/** HOOK: the message card and three falling chips. */
export const HOOK = {
  card: box(0, -300, 920, 200),
  encoding: box(-310, -70, 290, 80),
  signing: box(0, -70, 270, 80),
  encryption: box(310, -70, 310, 80),
};

/** ENCODING: the card morphs, an empty KEY slot and the red stamp. */
export const ENCODING = {
  card: box(0, -330, 920, 200),
  keySlot: box(0, -40, 460, 160),
  noKey: box(0, 100, 260, 80),
  stamp: box(0, 270, 680, 110),
};

/** SIGNING: message on top, the HMAC machine, two tag chips and the stamp. */
export const SIGNING = {
  card: box(0, -650, 920, 150),
  machine: box(0, -220, 900, 400),
  oldChip: box(-173, 80, 344, 80),
  newChip: box(173, 80, 344, 80),
  stamp: box(0, 260, 520, 120),
};

/** ENCRYPTION: lock, card, eavesdropper pointer, key row and the failed stamp. */
export const ENCRYPTION = {
  lock: box(0, -680, 180, 190),
  card: box(0, -430, 920, 180),
  eavesdrop: box(0, -140, 860, 90),
  keyIcon: box(-300, 30, 120, 120),
  keyChip: box(90, 30, 520, 90),
  stamp: box(0, 240, 560, 110),
};

/** VERDICT: three stacked rows, the AEAD chip and the Base64 chip. */
export const VERDICT = {
  encoding: box(0, -450, 920, 150),
  signing: box(0, -270, 920, 150),
  encryption: box(0, -90, 920, 150),
  aes: box(0, 120, 700, 80),
  base64: box(0, 250, 700, 90),
};
