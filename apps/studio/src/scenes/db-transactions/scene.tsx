import {defineLesson, loadFonts, type ChaptersFile} from '@motion-studio/video-kit';
import chapters from './chapters.json';
import {introSection} from './sections/01-intro';
import {problemSection} from './sections/02-the-problem';
import {beginCommitRollbackSection} from './sections/03-begin-commit-rollback';
import {acidSection} from './sections/04-acid';
import {isolationAnomaliesSection} from './sections/05-isolation-anomalies';
import {isolationLevelsSection} from './sections/06-isolation-levels';
import {durabilityWalSection} from './sections/07-durability-wal';
import {inCodeSection} from './sections/08-in-code';
import {recapSection} from './sections/09-recap';

// Inject the font stylesheet at module load, as the old local kit did, so the
// text layout is measured with the real fonts and not the fallback stack.
loadFonts();

export default defineLesson({
  chapters: chapters as ChaptersFile,
  sections: [
    introSection,
    problemSection,
    beginCommitRollbackSection,
    acidSection,
    isolationAnomaliesSection,
    isolationLevelsSection,
    durabilityWalSection,
    inCodeSection,
    recapSection,
  ],
  hud: {
    sectionChipX: -470,
    pills: {startX: 504, step: 46, width: 36, activeWidth: 64},
  },
});
