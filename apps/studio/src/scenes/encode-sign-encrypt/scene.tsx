import {defineLesson, loadFonts, type ChaptersFile} from '@motion-studio/video-kit';
import chapters from './chapters.json';
import {introSection} from './sections/01-intro';
import {problemSection} from './sections/02-problem';
import {encodingSection} from './sections/03-encoding';
import {hashingSection} from './sections/04-hashing';
import {signingSection} from './sections/05-signing';
import {chapter6Section} from './sections/06-chapter-6';
import {chapter7Section} from './sections/07-chapter-7';
import {chapter8Section} from './sections/08-chapter-8';
import {chapter9Section} from './sections/09-chapter-9';
import {chapter10Section} from './sections/10-chapter-10';

loadFonts();

export default defineLesson({
  chapters: chapters as ChaptersFile,
  sections: [
    introSection,
    problemSection,
    encodingSection,
    hashingSection,
    signingSection,
    chapter6Section,
    chapter7Section,
    chapter8Section,
    chapter9Section,
    chapter10Section,
  ],
  hud: {
    sectionChipX: -560,
    pills: {startX: 290, step: 60, width: 30, activeWidth: 64},
  },
});
