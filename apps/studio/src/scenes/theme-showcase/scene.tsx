import {defineLesson, loadFonts, type ChaptersFile} from '@motion-studio/video-kit';
import chapters from './chapters.json';
import {titleSection} from './sections/01-title';
import {paletteSection} from './sections/02-palette';
import {componentsSection} from './sections/03-components';
import {codeSection} from './sections/04-code';
import {treeSection} from './sections/05-tree';
import {hudSection} from './sections/06-hud';

// Inject the font stylesheet at module load so first-frame text is measured
// with the real stack and not the fallback.
loadFonts();

export default defineLesson({
  chapters: chapters as ChaptersFile,
  sections: [titleSection, paletteSection, componentsSection, codeSection, treeSection, hudSection],
});
