import { Image } from 'expo-image';
import { BottomTabBarHeightCallbackContext, type BottomTabBarProps } from 'expo-router/js-tabs';
import { PlatformPressable, useLinkBuilder } from 'expo-router/react-navigation';
import { Fragment, useContext, useState, type ComponentProps } from 'react';
import { Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { navigationAssets, type MainTabName } from '@/design/navigation-assets';
import { colors, fonts } from '@/design/tokens';

import {
  floatingBarBottom,
  floatingBarGeometry,
  useFloatingTabBarMetrics,
} from './floating-tab-bar-metrics';
import { handleTabListKeyDown } from './tab-list-keyboard';

const labels = {
  index: 'Home',
  quests: 'Quests',
  history: 'History',
  settings: 'Settings',
} as const;
type TabItemProps = Pick<
  ComponentProps<typeof PlatformPressable>,
  'href' | 'onPress' | 'onLongPress' | 'accessibilityLabel' | 'nativeID'
> & {
  name: MainTabName;
  label: string;
  selected: boolean;
  expanded: boolean;
  panelId: string;
};

function TabItem({
  name,
  label,
  selected,
  expanded,
  panelId,
  accessibilityLabel,
  ...props
}: TabItemProps) {
  const [focused, setFocused] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const icon = navigationAssets[name];
  return (
    <PlatformPressable
      {...props}
      {...(Platform.OS === 'web'
        ? { tabIndex: selected ? (0 as const) : (-1 as const), 'aria-controls': panelId }
        : {})}
      accessibilityRole="tab"
      role="tab"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      aria-selected={selected}
      testID={`main-tab-${name}`}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={[styles.target, expanded && styles.expandedControl, focused && styles.focused]}>
      <View style={[styles.pill, selected && styles.activePill, expanded && styles.expandedPill]}>
        {!imageFailed ? (
          <View style={{ width: icon.slotSize, height: icon.slotSize, flexShrink: 0 }}>
            <Image
              source={selected ? icon.active : icon.inactive}
              contentFit="contain"
              accessible={false}
              accessibilityElementsHidden
              aria-hidden
              onError={() => setImageFailed(true)}
              testID={`main-tab-icon-${name}`}
              style={{
                position: 'absolute',
                width: icon.width,
                height: icon.height,
                left: 'left' in icon ? icon.left : 0,
                top: 'top' in icon ? icon.top : 0,
              }}
            />
          </View>
        ) : null}
        {selected || expanded || imageFailed ? (
          <Text style={[styles.label, !selected && styles.inactiveLabel]}>{label}</Text>
        ) : null}
      </View>
    </PlatformPressable>
  );
}

/** Expo SDK 58's public tab adapter owns events and history; presentation does not route itself. */
export function MainTabBar({
  state,
  descriptors,
  emitter,
  navigateToTab,
  insets,
}: BottomTabBarProps) {
  const { buildHref } = useLinkBuilder();
  const notifyHeight = useContext(BottomTabBarHeightCallbackContext);
  const metrics = useFloatingTabBarMetrics();
  const idPrefix = metrics?.idPrefix ?? 'main-navigation';
  const { width, fontScale } = useWindowDimensions();
  const bottom = floatingBarBottom(insets.bottom);
  const expanded = fontScale > 1.3 || width - insets.left - insets.right - 40 < 280;
  const activeName = state.routes[state.index]?.name;
  return (
    <View
      {...(Platform.OS === 'web' ? { onKeyDownCapture: handleTabListKeyDown } : {})}
      role="tablist"
      accessibilityLabel="Main navigation"
      testID="main-tab-bar"
      onLayout={({ nativeEvent }) => {
        const height = Math.ceil(nativeEvent.layout.height);
        if (height <= 0) return;
        metrics?.reportHeight(height);
        notifyHeight?.(height + bottom);
      }}
      style={[
        styles.bar,
        {
          left: insets.left + floatingBarGeometry.sideGap,
          right: insets.right + floatingBarGeometry.sideGap,
          bottom,
        },
      ]}>
      {state.routes.map((route, index) => {
        if (!Object.hasOwn(labels, route.name) || descriptors[route.key].options.hidden)
          return null;
        const name = route.name as MainTabName;
        const selected = index === state.index;
        return (
          // Router can replace route keys during activation; the four tab names are
          // stable. Keep the focused control mounted instead of dropping focus to body.
          <Fragment key={route.name}>
            <View style={expanded && styles.expandedTarget}>
              <TabItem
                name={name}
                label={labels[name]}
                accessibilityLabel={descriptors[route.key].options.tabBarAccessibilityLabel}
                selected={selected}
                nativeID={`${idPrefix}-tab-${name}`}
                panelId={`${idPrefix}-panel-${name}`}
                expanded={expanded}
                href={buildHref(route.name, route.params)}
                onPress={() => {
                  const event = emitter.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (!selected && !event.defaultPrevented) navigateToTab(route.key);
                }}
                onLongPress={() => emitter.emit({ type: 'tabLongPress', target: route.key })}
              />
            </View>
            {/* Home/Quests/History source bars place remaining icons at the trailing edge. */}
            {name === 'index' && !expanded && activeName !== 'settings' ? (
              <View style={styles.spacer} />
            ) : null}
          </Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    zIndex: 1,
    minHeight: floatingBarGeometry.minHeight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 31,
    backgroundColor: colors.darkNav,
    boxShadow: '0px 8px 24px rgba(0,0,0,0.25)',
    flexDirection: 'row',
    // Browser text-only scaling does not update RN Web's fontScale. Let the real
    // intrinsic label width wrap too; onLayout reports the resulting footer height.
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  spacer: { flex: 1 },
  target: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
  },
  expandedTarget: { flexBasis: '48%', flexGrow: 1, minWidth: 0 },
  expandedControl: { alignSelf: 'stretch' },
  expandedPill: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  pill: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 24,
    // Keep a native background drawable from mount when selection changes color.
    backgroundColor: colors.darkNav,
  },
  activePill: {
    backgroundColor: colors.action,
    paddingLeft: 16,
    paddingRight: 20,
    paddingVertical: 10,
  },
  label: {
    flexShrink: 1,
    fontFamily: fonts.bold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.onAction,
  },
  inactiveLabel: { color: colors.darkMuted },
  focused: {
    outlineStyle: 'solid',
    outlineColor: colors.darkFocus,
    outlineWidth: 2,
    outlineOffset: 2,
  },
});
