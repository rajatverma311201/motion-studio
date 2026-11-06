import {defineLesson, loadFonts, type ChaptersFile} from '@motion-studio/video-kit';
import chapters from './chapters.json';
import {introSection} from './sections/01-intro';
import {problemSection} from './sections/02-problem';
import {encodingSection} from './sections/03-encoding';
import {hashingSection} from './sections/04-hashing';
import {signingSection} from './sections/05-signing';
import {encryptionSection} from './sections/06-encryption';
import {keyPairsSection} from './sections/07-key-pairs';
import {combiningSection} from './sections/08-combining';
import {mixUpsSection} from './sections/09-mix-ups';
import {recapSection} from './sections/10-recap';

loadFonts();

export default defineLesson({
  chapters: chapters as ChaptersFile,
  sections: [
    introSection,
    problemSection,
    encodingSection,
    hashingSection,
    signingSection,
    encryptionSection,
    keyPairsSection,
    combiningSection,
    mixUpsSection,
    recapSection,
  ],
  hud: {
    sectionChipX: -560,
    pills: {startX: 290, step: 60, width: 30, activeWidth: 64},
  },
});
