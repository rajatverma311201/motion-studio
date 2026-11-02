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

/** 00 INTRO — title slab, two chips and the full token typing in. */
export const INTRO = {
  title: box(0, -240, 700, 300),
  fullName: box(0, -35, 820, 70),
  security: box(0, 55, 320, 60),
  strip: box(0, 220, 1600, 140),
};

/** 01 WHY TOKENS — the login sequence, a session store and the final table. */
export const WHY = {
  sequence: box(-260, -40, 980, 620),
  cloud: box(-15, -250, 300, 120),
  store: box(560, -40, 520, 320),
  table: box(0, 20, 1500, 440),
};

/** 02 ANATOMY — the full strip, then the header, payload and signature zooms. */
export const ANATOMY = {
  fullStrip: box(0, -250, 1600, 190),
  headerLabel: box(-540, -90, 300, 60),
  payloadLabel: box(0, -90, 320, 60),
  signatureLabel: box(540, -90, 320, 60),
  stripTop: box(0, -350, 1600, 100),
  headerPanel: box(-430, -80, 620, 260),
  headerTable: box(470, -80, 700, 270),
  payloadPanel: box(-390, 0, 720, 390),
  claimsTable: box(450, 0, 780, 450),
  signatureBlock: box(0, -130, 980, 120),
  formula: box(0, -15, 820, 70),
  signatureNote: box(0, 80, 700, 60),
};

/** 03 BASE64URL — the Man walkthrough, the header decode and the final stamp. */
export const BASE64 = {
  visual: box(0, 0, 1500, 640),
  decodeLeft: box(-300, -370, 320, 64),
  decodeArrow: box(0, -370, 80, 60),
  decodeRight: box(300, -370, 300, 64),
  stamp: box(0, 370, 760, 76),
};

/** 04 ENCODE SIGN ENCRYPT — the three-column table, then the labelled strip. */
export const ENCODE = {
  table: box(0, -40, 1600, 520),
  strip: box(0, 315, 1600, 90),
  encodedHeader: box(-540, 385, 300, 40),
  encodedPayload: box(0, 385, 300, 40),
  signed: box(540, 385, 300, 40),
};

/** 05 SIGNING — build the input, sign, verify, tamper, reject. */
export const SIGNING = {
  strip: box(0, -360, 1700, 100),
  headerChip: box(-390, -260, 460, 64),
  dot: box(-40, -260, 50, 64),
  payloadChip: box(300, -260, 600, 64),
  signingInput: box(0, -150, 1200, 60),
  machine: box(0, 110, 1000, 420),
  sigOriginal: box(-350, -230, 640, 60),
  sigRecomputed: box(350, -230, 640, 60),
  match: box(0, -140, 320, 80),
  tamper: box(0, -240, 900, 60),
  tamperOriginal: box(-350, -140, 640, 60),
  tamperRecomputed: box(350, -140, 640, 60),
  invalid: box(650, -30, 340, 100),
  note: box(0, 150, 700, 76),
  tamperMachine: box(0, 150, 880, 360),
};

/** 06 KEYS — shared secrets, a key pair, the JWKS document and rotation. */
export const KEYS = {
  authServer: box(-520, -110, 380, 180),
  service1: box(260, -280, 340, 130),
  service2: box(260, -100, 340, 130),
  service3: box(260, 80, 340, 130),
  forged: box(600, 250, 440, 80),
  key1: box(0, -170, 520, 180),
  key2: box(0, 60, 520, 180),
  retired: box(-260, -170, 240, 80),
  rotateArrow: box(0, -55, 100, 40),
  jwksPanel: box(-420, 0, 700, 580),
  urlChip: box(520, -230, 640, 64),
  headerPanel: box(520, 20, 620, 220),
  kidChip: box(520, 160, 420, 56),
};

/** 07 CLAIMS — the time bar and checklist, then the refresh flow. */
export const CLAIMS = {
  bar: box(0, -260, 1500, 200),
  skew: box(600, -130, 300, 50),
  tokenStrip: box(0, 30, 1500, 110),
  status: box(560, 150, 300, 70),
  checklist: box(430, 300, 900, 200),
  refreshAccess: box(-430, -150, 300, 70),
  refreshExpired: box(-430, 0, 300, 70),
  refreshChip: box(-40, 80, 380, 70),
  refreshNew: box(430, -150, 340, 70),
  refreshStore: box(0, 250, 760, 120),
};

/** 08 IN PRACTICE — the login flow, storage table and Quarkus panels. */
export const PRACTICE = {
  sequence: box(0, -20, 1600, 640),
  storageTable: box(0, 0, 1200, 340),
  propertiesPanel: box(-450, -40, 760, 240),
  javaPanel: box(470, -20, 720, 340),
  extensionChip: box(0, 270, 600, 70),
};

/** 09 PITFALLS — a 2 x 3 card grid. */
export const PITFALLS = {
  card1: box(-390, -270, 760, 190),
  card2: box(390, -270, 760, 190),
  card3: box(-390, 0, 760, 190),
  card4: box(390, 0, 760, 190),
  card5: box(-390, 270, 760, 190),
  card6: box(390, 270, 760, 190),
};

/** 10 RECAP — five rows and two closing tags. */
export const RECAP = {
  row1: box(0, -290, 1500, 88),
  row2: box(0, -170, 1500, 88),
  row3: box(0, -50, 1500, 88),
  row4: box(0, 70, 1500, 88),
  row5: box(0, 190, 1500, 88),
  tag1: box(-330, 330, 560, 74),
  tag2: box(330, 330, 480, 74),
};
