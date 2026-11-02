import {defineLesson, loadFonts, type ChaptersFile} from '@motion-studio/video-kit';
import chapters from './chapters.json';
import {introSection} from './sections/01-intro';
import {whyTokensSection} from './sections/02-why-tokens';
import {anatomySection} from './sections/03-anatomy';
import {base64UrlSection} from './sections/04-base64url';
import {encodeSignEncryptSection} from './sections/05-encode-sign-encrypt';
import {signingSection} from './sections/06-signing';
import {keysSection} from './sections/07-keys';
import {claimsSection} from './sections/08-claims';
import {inPracticeSection} from './sections/09-in-practice';
import {pitfallsSection} from './sections/10-pitfalls';
import {recapSection} from './sections/11-recap';

loadFonts();

export default defineLesson({
  chapters: chapters as ChaptersFile,
  sections: [
    introSection,
    whyTokensSection,
    anatomySection,
    base64UrlSection,
    encodeSignEncryptSection,
    signingSection,
    keysSection,
    claimsSection,
    inPracticeSection,
    pitfallsSection,
    recapSection,
  ],
  hud: {
    sectionChipX: -560,
    pills: {startX: 290, step: 60, width: 30, activeWidth: 64},
  },
});
