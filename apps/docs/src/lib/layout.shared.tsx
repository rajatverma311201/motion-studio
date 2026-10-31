import type {BaseLayoutProps} from 'fumadocs-ui/layouts/shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: 'Motion Studio',
      url: '/',
    },
    links: [
      {type: 'main', text: 'Videos', url: '/'},
      {type: 'main', text: 'Docs', url: '/docs'},
    ],
  };
}
