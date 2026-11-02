import {defineLesson, loadFonts, type ChaptersFile} from '@motion-studio/video-kit';
import chapters from './chapters.json';
import {introSection} from './sections/01-intro';
import {whyTokensSection} from './sections/02-why-tokens';
import {anatomySection} from './sections/03-anatomy';
import {base64UrlSection} from './sections/04-base64url';
import {encodeSignEncryptSection} from './sections/05-encode-sign-encrypt';
import {signingSection} from './sections/06-signing';
import {chapter7Section} from './sections/07-chapter-7';
import {chapter8Section} from './sections/08-chapter-8';
import {chapter9Section} from './sections/09-chapter-9';
import {chapter10Section} from './sections/10-chapter-10';
import {chapter11Section} from './sections/11-chapter-11';

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
    chapter7Section,
    chapter8Section,
    chapter9Section,
    chapter10Section,
    chapter11Section,
  ],
  hud: {
    sectionChipX: -560,
    pills: {startX: 290, step: 60, width: 30, activeWidth: 64},
  },
});
