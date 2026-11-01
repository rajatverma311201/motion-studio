import {defineLesson, loadFonts, type ChaptersFile} from '@motion-studio/video-kit';
import chapters from './chapters.json';
import {introSection} from './sections/01-intro';
import {memorySection} from './sections/02-memory';
import {cpuPartsSection} from './sections/03-cpu-parts';
import {loadingSection} from './sections/04-loading';
import {fetchSection} from './sections/05-fetch';
import {decodeSection} from './sections/06-decode';
import {executeSection} from './sections/07-execute';
import {fullRunSection} from './sections/08-full-run';
import {jumpsSection} from './sections/09-jumps';
import {recapSection} from './sections/10-recap';

loadFonts();

export default defineLesson({
  chapters: chapters as ChaptersFile,
  sections: [
    introSection,
    memorySection,
    cpuPartsSection,
    loadingSection,
    fetchSection,
    decodeSection,
    executeSection,
    fullRunSection,
    jumpsSection,
    recapSection,
  ],
  hud: {
    sectionChipX: -470,
    pills: {startX: 500, step: 42, width: 32, activeWidth: 58},
  },
});
