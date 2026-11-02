import {defineLesson, loadFonts, type ChaptersFile} from '@motion-studio/video-kit';
import chapters from './chapters.json';
import {introSection} from './sections/01-intro';
import {chapter2Section} from './sections/02-chapter-2';
import {chapter3Section} from './sections/03-chapter-3';
import {chapter4Section} from './sections/04-chapter-4';
import {chapter5Section} from './sections/05-chapter-5';
import {chapter6Section} from './sections/06-chapter-6';

loadFonts();

export default defineLesson({
  chapters: chapters as ChaptersFile,
  sections: [introSection, chapter2Section, chapter3Section, chapter4Section, chapter5Section, chapter6Section],
});
