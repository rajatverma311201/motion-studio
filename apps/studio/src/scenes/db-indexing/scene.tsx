import {defineLesson, type ChaptersFile} from '@motion-studio/video-kit';
import chapters from './chapters.json';
import {introSection} from './sections/01-intro';
import {scanSection} from './sections/02-full-table-scan';
import {sortedIndexSection} from './sections/03-sorted-index';
import {binaryTreesSection} from './sections/04-binary-trees';
import {pagesAndFanoutSection} from './sections/05-pages-and-fanout';
import {btreeRulesSection} from './sections/06-btree-rules';
import {btreeSearchSection} from './sections/07-btree-search';
import {btreeInsertSection} from './sections/08-btree-insert';
import {btreeVsBplustreeSection} from './sections/09-btree-vs-bplustree';
import {bplustreeInsertSection} from './sections/10-bplustree-insert';
import {lookupAndRangeScanSection} from './sections/11-lookup-and-range-scan';
import {bplustreeDeleteSection} from './sections/12-bplustree-delete';
import {whyBplustreeWinsSection} from './sections/13-why-bplustree-wins';
import {clusteredVsSecondarySection} from './sections/14-clustered-vs-secondary';
import {compositeIndexesSection} from './sections/15-composite-indexes';
import {costOfIndexesSection} from './sections/16-cost-of-indexes';
import {explainAndGotchasSection} from './sections/17-explain-and-gotchas';
import {recapSection} from './sections/18-recap';

export default defineLesson({
  chapters: chapters as ChaptersFile,
  sections: [
    introSection,
    scanSection,
    sortedIndexSection,
    binaryTreesSection,
    pagesAndFanoutSection,
    btreeRulesSection,
    btreeSearchSection,
    btreeInsertSection,
    btreeVsBplustreeSection,
    bplustreeInsertSection,
    lookupAndRangeScanSection,
    bplustreeDeleteSection,
    whyBplustreeWinsSection,
    clusteredVsSecondarySection,
    compositeIndexesSection,
    costOfIndexesSection,
    explainAndGotchasSection,
    recapSection,
  ],
});
