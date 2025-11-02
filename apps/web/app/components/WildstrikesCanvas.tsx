'use client';

import { useEffect, useRef } from 'react';

export default function WildstrikesCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

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