/** @jest-environment jsdom */
import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { IntroSurface } from './IntroSurface.web';
import { INITIAL_PROGRESS, scrollIntro } from './progress';

let root: Root;
let element: HTMLDivElement;
beforeEach(() => {
  jest.useFakeTimers();
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  element = document.createElement('div');
  document.body.appendChild(element);
  root = createRoot(element);
});
afterEach(async () => {
  await act(async () => root.unmount());
  element.remove();
  jest.useRealTimers();
});
async function wheel(deltaY: number, deltaX = 0) {
  await act(async () => {
    element.firstElementChild!.dispatchEvent(new WheelEvent('wheel', { deltaY, deltaX, bubbles: true, cancelable: true }));
  });
}
async function endBurst() { await act(async () => { jest.advanceTimersByTime(200); }); }

it('coalesces wheel momentum into one gesture instead of skipping both sections', async () => {
  const onScroll = jest.fn();
  await act(async () => root.render(<IntroSurface enabled onScrollGesture={onScroll}>Intro</IntroSurface>));
  await wheel(80);
  await wheel(100);
  expect(onScroll).not.toHaveBeenCalled();
  await endBurst();
  expect(onScroll).toHaveBeenCalledTimes(1);
  expect(onScroll).toHaveBeenCalledWith(180);
});
it('advances on the fifth very light wheel gesture using the real progress controller', async () => {
  let state = INITIAL_PROGRESS;
  await act(async () => root.render(<IntroSurface enabled onScrollGesture={distance => { state = scrollIntro(state, distance); }}>Intro</IntroSurface>));
  for (let i = 0; i < 4; i++) { await wheel(8); await endBurst(); }
  expect(state.section).toBe(0);
  await wheel(8);
  await endBurst();
  expect(state.section).toBe(1);
});
it('ignores horizontal scrolling and does not count downward/reverse movement', async () => {
  let state = INITIAL_PROGRESS;
  await act(async () => root.render(<IntroSurface enabled onScrollGesture={distance => { state = scrollIntro(state, distance); }}>Intro</IntroSurface>));
  await wheel(10, 100);
  await wheel(-100);
  await endBurst();
  expect(state).toBe(INITIAL_PROGRESS);
});
it('cancels delayed wheel callbacks when the surface unmounts', async () => {
  const onScroll = jest.fn();
  await act(async () => root.render(<IntroSurface enabled onScrollGesture={onScroll}>Intro</IntroSurface>));
  await wheel(100);
  await act(async () => root.render(null));
  await endBurst();
  expect(onScroll).not.toHaveBeenCalled();
});
it('leaves ordinary scrolling alone when reduced-motion controls disable the challenge', async () => {
  const onScroll = jest.fn();
  await act(async () => root.render(<IntroSurface enabled={false} onScrollGesture={onScroll}>Intro</IntroSurface>));
  await wheel(200);
  await endBurst();
  expect(onScroll).not.toHaveBeenCalled();
});
