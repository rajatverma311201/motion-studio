const STUDIO_URL = 'http://localhost:9000';

/**
 * Built project bundle emitted by `pnpm studio:build` into the docs public folder.
 * Verified path: apps/docs/public/videos/projects/src/projects/<slug>.js.
 */
export function videoSrc(slug: string): string {
  return `/videos/projects/src/projects/${slug}.js`;
}

/** Editor URL for a project; the studio dev server must be running on port 9000. */
export function studioEditorUrl(slug: string): string {
  return `${STUDIO_URL}/src/projects/${slug}`;
}
