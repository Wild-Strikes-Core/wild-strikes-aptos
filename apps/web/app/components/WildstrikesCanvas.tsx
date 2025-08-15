'use client';

import { useEffect, useRef } from 'react';

export default function WildstrikesCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let game: Phaser.Game | null = null;
    if (!containerRef.current) return;

    // Prevent context menu on the container
    const container = containerRef.current;
    // Ensure container can receive focus for keyboard handling
    if (!container.hasAttribute('tabindex')) {
      container.setAttribute('tabindex', '0');
    }
    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };
    container.addEventListener('contextmenu', preventContextMenu);

    // Prevent browser defaults for game combos at capture phase without stopping propagation
    const preventBrowserShortcuts = (e: KeyboardEvent) => {
      const active = (document.activeElement as HTMLElement | null);
      const inContainer = !!active && (active === container || container.contains(active));
      if (!inContainer) return;
      if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyD' || e.code === 'Space')) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', preventBrowserShortcuts, true);
    window.addEventListener('keyup', preventBrowserShortcuts, true);
    
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
        // Focus the container so keyboard events are scoped here
        container.focus();
      }
    });

    return () => {
      container.removeEventListener('contextmenu', preventContextMenu);
      window.removeEventListener('keydown', preventBrowserShortcuts, true);
      window.removeEventListener('keyup', preventBrowserShortcuts, true);
      observer.disconnect();
      if (game) game.destroy(true);
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full" 
      tabIndex={0}
      onKeyDown={(e) => {
        // Only prevent browser default if event originated inside our container/canvas
        const target = e.target as HTMLElement | null;
        const isInside = target && containerRef.current && containerRef.current.contains(target);
        if (isInside && (e.ctrlKey || e.metaKey) && (e.code === 'KeyD' || e.code === 'Space')) {
          e.preventDefault();
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        return false;
      }}
      style={{ userSelect: 'none' }}
      onPointerDown={() => {
        // Keep focus on the container when interacting
        containerRef.current?.focus();
      }}
    />
  );
} 