import path from 'node:path';
import {createVoiceHandler} from './handler.mjs';

/**
 * Vite plugin that mounts the voice server on the dev server only.
 *
 * @returns {import('vite').Plugin}
 */
export function voiceServerPlugin() {
  return {
    name: 'motion-studio/voice-server',
    apply: 'serve',
    configureServer(server) {
      const rootDir = path.resolve(server.config.root, 'voice');
      server.middlewares.use(createVoiceHandler({rootDir}));
    },
  };
}
