import {defineLesson, loadFonts, type ChaptersFile} from '@motion-studio/video-kit';
import chapters from './chapters.json';
import {hookSection} from './sections/01-hook';
import {encodingSection} from './sections/02-encoding';
import {signingSection} from './sections/03-signing';
import {encryptionSection} from './sections/04-encryption';
import {verdictSection} from './sections/05-verdict';

loadFonts();

export default defineLesson({
  chapters: chapters as ChaptersFile,
  sections: [hookSection, encodingSection, signingSection, encryptionSection, verdictSection],
});
