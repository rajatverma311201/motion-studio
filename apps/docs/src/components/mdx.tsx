import {Step, Steps} from 'fumadocs-ui/components/steps';
import {Tab, Tabs} from 'fumadocs-ui/components/tabs';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import type {MDXComponents} from 'mdx/types';
import {ColorSwatches} from '@/components/color-swatches';
import {StatusBadge} from '@/components/notes/status-badge';
import {SummaryPoints} from '@/components/notes/summary-points';
import {VoiceoverNotes} from '@/components/notes/voiceover-notes';
import {YoutubeDescription} from '@/components/notes/youtube-description';
import {ThemeTable} from '@/components/theme-table';
import {LessonChapters} from '@/components/video/lesson-chapters';
import {LessonVideo} from '@/components/video/lesson-video';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Tabs,
    Tab,
    Steps,
    Step,
    LessonVideo,
    LessonChapters,
    VoiceoverNotes,
    SummaryPoints,
    YoutubeDescription,
    StatusBadge,
    ColorSwatches,
    ThemeTable,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
