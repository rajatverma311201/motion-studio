import tailwindcss from '@tailwindcss/vite';
import {tanstackStart} from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import {fumadocsMdx} from 'fumadocs-mdx/vite';
import {defineConfig} from 'vite';

export default defineConfig(({command, isPreview}) => {
  if (command === 'serve' && !isPreview) {
    process.env.NODE_ENV = 'development';
  }

  return {
    server: {
      port: 3000,
    },
    resolve: {
      tsconfigPaths: true,
    },
    plugins: [fumadocsMdx(), tailwindcss(), tanstackStart(), viteReact()],
  };
});
