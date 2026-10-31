/**
 * Dark neubrutalism palette shared by every lesson.
 * Keep the keys stable: scenes reference colours by name.
 */
export const colors = {
  bg: '#0B0B10',
  grid: 'rgba(255,255,255,0.045)',
  surf: '#15151D',
  surf2: '#1F1F2B',
  code: '#0F0F16',
  ink: '#F4F1EA',
  dark: '#0B0B10',
  lime: '#C6FF3D',
  pink: '#FF4D8D',
  cyan: '#3DE3FF',
  yellow: '#FFD23D',
  violet: '#9B7BFF',
  orange: '#FF8A3D',
  red: '#FF4D4D',
  mute: '#9A99A8',
  dim: '#3A3950',
  redBg: '#3A1521',
  limeBg: '#18301C',
  clear: 'rgba(244,241,234,0)',
} as const;

export type ColorName = keyof typeof colors;
