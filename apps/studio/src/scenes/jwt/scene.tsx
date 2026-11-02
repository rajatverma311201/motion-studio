import {defineLesson, loadFonts, type ChaptersFile} from '@motion-studio/video-kit';
import chapters from './chapters.json';
import {introSection} from './sections/01-intro';
import {chapter2Section} from './sections/02-chapter-2';
import {chapter3Section} from './sections/03-chapter-3';
import {chapter4Section} from './sections/04-chapter-4';
import {chapter5Section} from './sections/05-chapter-5';
import {chapter6Section} from './sections/06-chapter-6';
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
    chapter2Section,
    chapter3Section,
    chapter4Section,
    chapter5Section,
    chapter6Section,
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
