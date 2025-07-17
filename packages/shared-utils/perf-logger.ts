import { SOCKET } from './socket';

export class PerformanceLogger {
  private intervalId: NodeJS.Timeout | null = null;
  private lastPackets = 0;
  private packetBytes = 0;
  start(periodMs = 5000) {
    const fpsCounter = { frames: 0 };
    const loop = () => fpsCounter.frames++;
    if (typeof window !== 'undefined') {
      requestAnimationFrame(function raf() { loop(); requestAnimationFrame(raf); });
    }

    SOCKET.onAny((_event, ...args) => {
      this.packetBytes += JSON.stringify(args).length;
      this.lastPackets++;
    });

    const ping = async () => {
      const start = Date.now();
      await new Promise(res => SOCKET.timeout(1000).emit('ping', {}, res));
      return Date.now() - start;
    };

    this.intervalId = setInterval(async () => {
      const fps = fpsCounter.frames / (periodMs / 1000);
      fpsCounter.frames = 0;
      const rtt = await ping();
      const packets = this.lastPackets;
      const bytes = this.packetBytes;
      this.lastPackets = 0;
      this.packetBytes = 0;
      console.log(`PERF | FPS:${fps.toFixed(1)} RTT:${rtt}ms Packets:${packets} Bytes:${bytes}`);
    }, periodMs);
  }

  stop() {
    if (this.intervalId) clearInterval(this.intervalId);
  }
} 