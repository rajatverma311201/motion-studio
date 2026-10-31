import {DocsLayout} from 'fumadocs-ui/layouts/docs';
import {DocsBody, DocsPage, DocsTitle} from 'fumadocs-ui/layouts/docs/page';
import {baseOptions} from '@/lib/layout.shared';
import {source} from '@/lib/source';

export function NotFound() {
  return (
    <DocsLayout {...baseOptions()} tree={source.getPageTree()}>
      <DocsPage>
        <DocsTitle>Page not found</DocsTitle>
        <DocsBody>
          <p>That page does not exist. The lessons are all in the sidebar.</p>
          <p>
            <a className="text-fd-primary underline underline-offset-4" href="/docs">
              Back to the docs
            </a>
          </p>
        </DocsBody>
      </DocsPage>
    </DocsLayout>
  );
}
