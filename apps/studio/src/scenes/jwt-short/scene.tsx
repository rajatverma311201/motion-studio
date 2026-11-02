import {defineLesson, loadFonts, type ChaptersFile} from '@motion-studio/video-kit';
import chapters from './chapters.json';
import {hookSection} from './sections/01-hook';
import {partsSection} from './sections/02-parts';
import {readableSection} from './sections/03-readable';
import {signatureSection} from './sections/04-signature';
import {tamperSection} from './sections/05-tamper';
import {takeawaySection} from './sections/06-takeaway';

loadFonts();

export default defineLesson({
  chapters: chapters as ChaptersFile,
  sections: [hookSection, partsSection, readableSection, signatureSection, tamperSection, takeawaySection],
});
