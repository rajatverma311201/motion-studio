/** Font stacks used across the videos. */
export const fonts = {
  sans: '"Space Grotesk", Inter, "Segoe UI", sans-serif',
  mono: '"JetBrains Mono", "SF Mono", Menlo, Consolas, monospace',
} as const;

/**
 * Inject the Google Fonts stylesheet once. Safe to call in Node (no DOM).
 *
 * @example
 * loadFonts();
 */
export function loadFonts(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById('video-kit-fonts')) return;
  try {
    const link = document.createElement('link');
    link.id = 'video-kit-fonts';
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=JetBrains+Mono:wght@400;700&display=swap';
    document.head.appendChild(link);
  } catch {
    /* offline or no DOM */
  }
}
