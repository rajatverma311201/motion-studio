/** A centre-plus-size rectangle in 1920 x 1080 scene coordinates. */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Build a layout box. Origin is the centre; y grows downwards. */
export const box = (x: number, y: number, w: number, h: number): Box => ({x, y, w, h});

/** Safe content area: 60 px inside the 1920 px width and above the caption bar. */
export const SAFE = {x0: -930, x1: 930, y0: -410, y1: 410} as const;

/**
 * The recurring message card. It keeps this position and size in chapters 2 to
 * 6 so the viewer can follow one object through every transformation.
 */
export const MESSAGE = box(0, -320, 920, 96);

/** 00 INTRO — the title slab, two chips and the four tool tiles. */
export const INTRO = {
  title: box(0, -250, 1720, 190),
  difference: box(0, -80, 620, 56),
  course: box(0, -10, 340, 56),
  encoding: box(-645, 170, 400, 190),
  hashing: box(-215, 170, 400, 190),
  signing: box(215, 170, 400, 190),
  encryption: box(645, 170, 400, 190),
};

/** 01 THE PROBLEM — the Alice/Eve/Bank sequence and the four need cards. */
export const PROBLEM = {
  sequence: box(0, -130, 1300, 460),
  /** Decorative dashed container around Eve; it sits inside the sequence. */
  network: box(0, -130, 433, 460),
  format: box(-690, 280, 440, 120),
  secrecy: box(-230, 280, 440, 120),
  integrity: box(230, 280, 440, 120),
  authenticity: box(690, 280, 440, 120),
};

/** 02 ENCODING — the card, the empty key slot, three forms, HTTP Basic and the stamp. */
export const ENCODING = {
  keySlot: box(0, -150, 460, 130),
  hex: box(-640, 20, 560, 120),
  url: box(0, 20, 560, 120),
  utf8: box(640, 20, 560, 120),
  code: box(-240, 235, 960, 140),
  arrow: box(310, 235, 100, 50),
  decoded: box(650, 235, 560, 90),
  stamp: box(0, 370, 760, 76),
};

/** 03 HASHING — the SHA-256 machine, the fingerprint, the avalanche grid and the tamper beat. */
export const HASHING = {
  machine: box(0, -60, 1100, 220),
  fingerprint: box(0, 190, 1000, 180),
  oneWay: box(0, 335, 900, 90),
  avalanche: box(-360, 35, 380, 430),
  usedFor: box(420, 40, 900, 320),
  tamperEdit: box(0, -120, 900, 80),
  hashOriginal: box(-280, 40, 520, 90),
  hashRecomputed: box(280, 40, 520, 90),
  match: box(0, 150, 300, 60),
  noOrigin: box(0, 290, 760, 76),
};

/** 04 SIGNING — the shared-key act, the tamper act and the digital-signature act. */
export const SIGNING = {
  keyRow: box(0, -170, 760, 70),
  machine: box(0, 70, 1100, 340),
  tagRow: box(0, 290, 1000, 70),
  invalid: box(0, 370, 500, 70),
  tamper: box(0, -170, 900, 60),
  signature: box(0, -190, 1100, 80),
  privateCard: box(-500, 20, 560, 300),
  publicCard: box(500, 20, 560, 300),
  valid: box(-260, 250, 480, 80),
  invalidSignature: box(260, 250, 480, 80),
  uses: box(0, 360, 1700, 70),
};

/** 05 ENCRYPTION — the AES machine, the eavesdropper, the wrong key and the final question. */
export const ENCRYPTION = {
  lock: box(-620, -320, 120, 120),
  nonce: box(700, -320, 440, 80),
  machine: box(0, 15, 1240, 370),
  eavesdrop: box(0, 240, 860, 50),
  keyRow: box(0, 300, 760, 50),
  authFailed: box(0, 365, 500, 60),
  question: box(0, 110, 1200, 320),
};

/** 06 KEY PAIRS — the bank card, the hand-out, the flipped roles and hybrid encryption. */
export const KEY_PAIRS = {
  keyPair: box(0, -40, 620, 340),
  alice: box(-680, 150, 260, 90),
  eve: box(680, 150, 260, 90),
  aliceCard: box(-650, 140, 480, 240),
  bankCard: box(650, 140, 480, 240),
  cipherChip: box(0, 140, 520, 80),
  illustrative: box(0, 230, 360, 50),
  rolesTable: box(0, 40, 1100, 300),
  hybrid: box(0, 0, 1300, 480),
};

/** 07 COMBINING — the real-systems table and the AES-GCM highlight. */
export const COMBINING = {
  table: box(0, 0, 1500, 592),
  aes: box(0, 350, 700, 60),
};

/** 08 MIX-UPS — five myth cards that flip to the truth. */
export const MIX_UPS = {
  card1: box(0, -300, 1500, 96),
  card2: box(0, -180, 1500, 96),
  card3: box(0, -60, 1500, 96),
  card4: box(0, 60, 1500, 96),
  card5: box(0, 180, 1500, 96),
};

/** 09 RECAP — the closing matrix and the pick-the-tool tag. */
export const RECAP = {
  table: box(0, -40, 1500, 416),
  tag: box(0, 290, 1000, 70),
};
