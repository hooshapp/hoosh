import type { ViewProps } from 'react-native';

type TabListKeyEvent = Parameters<NonNullable<ViewProps['onKeyDownCapture']>>[0];

/** Web manual-activation tabs: arrows move focus; Enter/Space activate the real link. */
export function handleTabListKeyDown(event: TabListKeyEvent) {
  if (
    typeof Element === 'undefined' ||
    !(event.target instanceof Element) ||
    !(event.currentTarget instanceof HTMLElement)
  )
    return;
  const target = event.target.closest<HTMLElement>('[role="tab"]');
  if (!target || !event.currentTarget.contains(target)) return;
  const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]'));
  const index = tabs.indexOf(target);
  const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
  let next: number;
  switch (event.nativeEvent.key) {
    case 'ArrowRight':
      next = index + (rtl ? -1 : 1);
      break;
    case 'ArrowLeft':
      next = index + (rtl ? 1 : -1);
      break;
    case 'Home':
      next = 0;
      break;
    case 'End':
      next = tabs.length - 1;
      break;
    case ' ':
      event.preventDefault();
      target.click();
      return;
    default:
      return;
  }
  event.preventDefault();
  tabs[(next + tabs.length) % tabs.length]?.focus();
}
