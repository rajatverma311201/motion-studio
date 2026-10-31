import {Callout} from 'fumadocs-ui/components/callout';
import {Card} from 'fumadocs-ui/components/card';
import {CodeBlock, Pre} from 'fumadocs-ui/components/codeblock';
import {Step, Steps} from 'fumadocs-ui/components/steps';
import {Tab, Tabs} from 'fumadocs-ui/components/tabs';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import type {MDXComponents} from 'mdx/types';
import type {ComponentProps} from 'react';
import {ColorSwatches} from '@/components/color-swatches';
import {LessonChapters} from '@/components/video/lesson-chapters';
import {LessonVideo} from '@/components/video/lesson-video';

function withClass(base: string, className?: string): string {
  return className ? `${base} ${className}` : base;
}

function NeubrutalistCallout({className, ...props}: ComponentProps<typeof Callout>) {
  return <Callout className={withClass('nb-callout', className)} {...props} />;
}

function NeubrutalistCard({className, ...props}: ComponentProps<typeof Card>) {
  return <Card className={withClass('nb-card', className)} {...props} />;
}

function NeubrutalistPre({className, children, ...props}: ComponentProps<'pre'>) {
  return (
    <CodeBlock className={withClass('nb-codeblock', className)} {...props}>
      <Pre>{children}</Pre>
    </CodeBlock>
  );
}

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    pre: NeubrutalistPre,
    Card: NeubrutalistCard,
    Callout: NeubrutalistCallout,
    Tabs,
    Tab,
    Steps,
    Step,
    LessonVideo,
    LessonChapters,
    ColorSwatches,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
