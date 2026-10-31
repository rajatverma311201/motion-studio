import type {BaseLayoutProps} from 'fumadocs-ui/layouts/shared';
import {BrandTitle} from '@/components/brand-title';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: <BrandTitle />,
      url: '/docs',
    },
    themeSwitch: {
      enabled: false,
    },
  };
}
