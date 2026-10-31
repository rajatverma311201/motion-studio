import {DocsLayout} from 'fumadocs-ui/layouts/docs';
import {DocsBody, DocsPage, DocsTitle} from 'fumadocs-ui/layouts/docs/page';
import {baseOptions} from '@/lib/layout.shared';
import {source} from '@/lib/source';

export function NotFound() {
  return (
    <DocsLayout {...baseOptions()} tree={source.getPageTree()}>
      <DocsPage>
        <p className="eyebrow">404</p>
        <DocsTitle>Page not found</DocsTitle>
        <DocsBody>
          <div className="nb-404">
            <p>That page does not exist. The lessons are all in the sidebar.</p>
            <p>
              <a href="/docs">Back to the docs</a>
            </p>
          </div>
        </DocsBody>
      </DocsPage>
    </DocsLayout>
  );
}
