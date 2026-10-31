import {createFileRoute, notFound} from '@tanstack/react-router';
import {DocsLayout} from 'fumadocs-ui/layouts/docs';
import {DocsBody, DocsDescription, DocsPage, DocsTitle} from 'fumadocs-ui/layouts/docs/page';
import {useMDXComponents} from '@/components/mdx';
import {baseOptions} from '@/lib/layout.shared';
import {source} from '@/lib/source';
import {pageTitle, siteDescription} from '@/lib/seo';

function parseSlugs(splat?: string): string[] {
  return splat?.split('/').filter(Boolean) ?? [];
}

export const Route = createFileRoute('/docs/$')({
  component: Page,
  loader: ({params}) => {
    const page = source.getPage(parseSlugs(params._splat));
    if (!page) throw notFound();

    return {
      title: page.data.title,
      description: page.data.description ?? null,
    };
  },
  head: ({loaderData}) => ({
    meta: [
      {title: pageTitle(loaderData?.title)},
      {name: 'description', content: loaderData?.description ?? siteDescription},
    ],
  }),
});

function Page() {
  const {_splat} = Route.useParams();
  const page = source.getPage(parseSlugs(_splat));
  if (!page) throw notFound();

  const MDX = page.data.body;

  return (
    <DocsLayout {...baseOptions()} tree={source.getPageTree()}>
      <DocsPage toc={page.data.toc}>
        <DocsTitle>{page.data.title}</DocsTitle>
        <DocsDescription>{page.data.description}</DocsDescription>
        <DocsBody>
          <MDX components={useMDXComponents()} />
        </DocsBody>
      </DocsPage>
    </DocsLayout>
  );
}
