export type CaptureClock = { now: () => number; schedule: (callback: () => void, delay: number) => () => void };
const clock: CaptureClock = {
  now: () => performance.now(),
  schedule: (callback, delay) => { const id = setTimeout(callback, delay); return () => clearTimeout(id); },
};

// Use a deadline so a delayed browser tick never extends the countdown.
export function startCaptureTimer(seconds: number, onTick: (remaining: number) => void, onCapture: () => void, timerClock = clock) {
  const deadline = timerClock.now() + seconds * 1000;
  let active = true;
  let cancelTick = () => {};
  function tick() {
    if (!active) return;
    const remaining = Math.max(0, Math.ceil((deadline - timerClock.now()) / 1000));
    onTick(remaining);
    if (remaining === 0) { active = false; onCapture(); }
    else cancelTick = timerClock.schedule(tick, Math.min(250, deadline - timerClock.now()));
  }
  tick();
  return () => { active = false; cancelTick(); };
}
