'use client';

import { useEffect, useRef } from 'react';

export default function WildstrikesCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let game: Phaser.Game | null = null;
    if (!containerRef.current) return;

    // Prevent context menu on the container
    const container = containerRef.current;
    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };
    
    container.addEventListener('contextmenu', preventContextMenu);
    
    // Also prevent on any canvas that gets created
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLCanvasElement) {
            node.addEventListener('contextmenu', preventContextMenu);
          }
        });
      });
    });
    
    observer.observe(container, { childList: true, subtree: true });

    import('@phaser-games/wildstrikes').then(({ default: WildstrikesGame }) => {
      game = new WildstrikesGame(containerRef.current!);
      
      // Additional prevention after game is created
      const canvas = container.querySelector('canvas');
      if (canvas) {
        canvas.addEventListener('contextmenu', preventContextMenu);
      }
    });

    return () => {
      container.removeEventListener('contextmenu', preventContextMenu);
      observer.disconnect();
      if (game) game.destroy(true);
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full" 
      onContextMenu={(e) => {
        e.preventDefault();
        return false;
      }}
      style={{ userSelect: 'none' }}
    />
  );
} 