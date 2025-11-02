'use client';

import { useB3 } from '@b3dotfun/sdk';
import { useEffect, useRef } from 'react';

export default function WildstrikesCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { open, status } = useB3();

  useEffect(() => {
    const handleConnect = () => {
      if (status === 'disconnected') {
        open();
      }
    };

    window.addEventListener('b3-connect-wallet', handleConnect);

    return () => {
      window.removeEventListener('b3-connect-wallet', handleConnect);
    };
  }, [open, status]);

  useEffect(() => {
    let game: Phaser.Game | null = null;
    if (!containerRef.current) return;

    import('@phaser-games/wildstrikes').then(({ default: WildstrikesGame }) => {
      game = new WildstrikesGame(containerRef.current!);
    });

    return () => {
      if (game) game.destroy(true);
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
}
 