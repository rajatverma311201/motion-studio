import {defineLesson, loadFonts, type ChaptersFile} from '@motion-studio/video-kit';
import chapters from './chapters.json';
import {introSection} from './sections/01-intro';
import {memorySection} from './sections/02-memory';
import {cpuPartsSection} from './sections/03-cpu-parts';
import {loadingSection} from './sections/04-loading';
import {fetchSection} from './sections/05-fetch';
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
    memorySection,
    cpuPartsSection,
    loadingSection,
    fetchSection,
    chapter6Section,
    chapter7Section,
    chapter8Section,
    chapter9Section,
    chapter10Section,
  ],
  hud: {
    sectionChipX: -470,
    pills: {startX: 500, step: 42, width: 32, activeWidth: 58},
  },
});
