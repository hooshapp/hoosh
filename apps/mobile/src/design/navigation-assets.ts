import historyActive from '../../assets/icons/navigation/history-active.svg';
import historyInactive from '../../assets/icons/navigation/history-inactive.svg';
import homeActive from '../../assets/icons/navigation/home-active.svg';
import homeInactive from '../../assets/icons/navigation/home-inactive.svg';
import questsActive from '../../assets/icons/navigation/quests-active.svg';
import questsInactive from '../../assets/icons/navigation/quests-inactive.svg';
import settingsActive from '../../assets/icons/navigation/settings-active.svg';
import settingsInactive from '../../assets/icons/navigation/settings-inactive.svg';

/** Unmodified Figma SVGs. Colors are part of each source, never runtime tinting. */
export const navigationAssets = {
  index: {
    active: homeActive,
    inactive: homeInactive,
    width: 21,
    height: 21,
    slotSize: 18,
    left: -1.5,
    top: -1.5,
  },
  quests: { active: questsActive, inactive: questsInactive, width: 20, height: 20, slotSize: 20 },
  history: {
    active: historyActive,
    inactive: historyInactive,
    width: 20,
    height: 20,
    slotSize: 20,
  },
  settings: {
    active: settingsActive,
    inactive: settingsInactive,
    width: 20,
    height: 20,
    slotSize: 20,
  },
} as const;

export type MainTabName = keyof typeof navigationAssets;
