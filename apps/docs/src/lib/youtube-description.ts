export interface DescriptionChapter {
  name: string;
  at?: string;
}

export interface YoutubeDescriptionInput {
  description: string;
  summaryPoints?: string[];
  chapters: readonly DescriptionChapter[];
}

const SMALL_WORDS = new Set([
  'a',
  'an',
  'and',
  'as',
  'at',
  'but',
  'by',
  'for',
  'from',
  'in',
  'into',
  'nor',
  'of',
  'on',
  'or',
  'the',
  'to',
  'vs',
  'via',
  'with',
]);

function capitalizeWord(word: string): string {
  return word.replace(
    /^([^\p{L}\p{N}]*)(\p{L})/u,
    (_, prefix: string, letter: string) => prefix + letter.toUpperCase(),
  );
}

/** Turn an upper-case HUD chapter name into the title case used on YouTube. */
export function titleCaseChapter(name: string): string {
  return name
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      if (index > 0 && SMALL_WORDS.has(word)) return word;
      return capitalizeWord(word);
    })
    .join(' ');
}

/** Build the copy-ready YouTube description from frontmatter and lesson data. */
export function buildYoutubeDescription({description, summaryPoints = [], chapters}: YoutubeDescriptionInput): string {
  const lines = [
    description.trim(),
    '',
    'In this video:',
    ...(summaryPoints.length > 0 ? summaryPoints.map(point => `- ${point}`) : ['- TODO: add summary points']),
    '',
    'Chapters:',
    ...chapters.map(chapter => `${chapter.at ?? '--:--'} ${titleCaseChapter(chapter.name)}`),
    '',
    '',
  ];

  return lines.join('\n');
}
