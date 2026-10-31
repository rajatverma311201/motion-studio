import {useEffect, useState} from 'react';

export type PlayerStatus = 'loading' | 'ready' | 'error';

/**
 * The player custom element needs the DOM, so the module is imported on the
 * client only. Server rendering keeps showing the skeleton until this resolves.
 */
export function usePlayerReady(): PlayerStatus {
  const [status, setStatus] = useState<PlayerStatus>('loading');

  useEffect(() => {
    let active = true;

    import('@motion-canvas/player')
      .then(() => {
        if (active) setStatus('ready');
      })
      .catch(() => {
        if (active) setStatus('error');
      });

    return () => {
      active = false;
    };
  }, []);

  return status;
}
