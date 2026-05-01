export function createLoop({ onTick, onFps }) {
  let running = false;
  let last = 0;
  let frames = 0;
  let lastFps = 0;
  let rafId = 0;

  function tick(time) {
    if (!running) return;
    const dt = last ? (time - last) / 1000 : 0;
    last = time;
    if (onTick) onTick(dt, time);

    frames += 1;
    if (!lastFps) lastFps = time;
    if (time - lastFps >= 1000) {
      const fps = Math.round((frames * 1000) / (time - lastFps));
      if (onFps) onFps(fps);
      frames = 0;
      lastFps = time;
    }

    rafId = requestAnimationFrame(tick);
  }

  function start() {
    if (running) return;
    running = true;
    last = 0;
    frames = 0;
    lastFps = 0;
    rafId = requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
  }

  return { start, stop };
}
