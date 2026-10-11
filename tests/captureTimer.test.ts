import assert from 'node:assert/strict';
import { test } from 'node:test';
import { startCaptureTimer, type CaptureClock } from '../src/captureTimer.ts';

function fakeClock() {
  let time = 0;
  const scheduled: { callback: () => void; cancelled: boolean }[] = [];
  const clock: CaptureClock = { now: () => time, schedule: callback => {
    const task = { callback, cancelled: false }; scheduled.push(task);
    return () => { task.cancelled = true; };
  } };
  return { clock, scheduled, advance: (milliseconds: number) => { time += milliseconds; const task = scheduled.at(-1); if (task && !task.cancelled) task.callback(); } };
}

test('camera countdown respects elapsed time and captures once at its deadline', () => {
  const timer = fakeClock(), ticks: number[] = [];
  let captures = 0;
  startCaptureTimer(10, value => ticks.push(value), () => captures++, timer.clock);
  assert.equal(ticks.at(-1), 10);
  timer.advance(4000); assert.equal(ticks.at(-1), 6); assert.equal(captures, 0);
  timer.advance(6000); assert.equal(ticks.at(-1), 0); assert.equal(captures, 1);
  timer.scheduled.at(-1)?.callback(); assert.equal(captures, 1);
});

test('cancelling or leaving camera prevents capture even if a queued tick arrives', () => {
  const timer = fakeClock();
  let captures = 0;
  const cancel = startCaptureTimer(5, () => {}, () => captures++, timer.clock);
  const queuedTick = timer.scheduled.at(-1)!.callback;
  cancel(); timer.advance(6000); queuedTick();
  assert.equal(captures, 0);
});
