import appCss from '@/styles/app.css?url';
import {createRootRoute, HeadContent, Outlet, Scripts} from '@tanstack/react-router';
import {RootProvider} from 'fumadocs-ui/provider/tanstack';
import type {ReactNode} from 'react';
import {NotFound} from '@/components/not-found';
import {pageTitle, siteDescription} from '@/lib/seo';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {charSet: 'utf-8'},
      {name: 'viewport', content: 'width=device-width, initial-scale=1'},
      {title: pageTitle()},
      {name: 'description', content: siteDescription},
    ],
    links: [{rel: 'stylesheet', href: appCss}],
  }),
  component: RootComponent,
  notFoundComponent: NotFound,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({children}: {children: ReactNode}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="flex min-h-screen flex-col">
        <RootProvider>{children}</RootProvider>
        <Scripts />
      </body>
    </html>
  );
}
