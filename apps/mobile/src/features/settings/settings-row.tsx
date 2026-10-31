import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/button';
import {
  DesignArtwork,
  type DesignAsset,
} from '@/components/ui/design-artwork';
import { settingsAssets } from '@/design/settings-assets';
import { colors, fonts } from '@/design/tokens';
import { settingsValueLabel, type SettingsValue } from './settings-model';

export type SettingsRowProps = {
  label: string;
  value: SettingsValue;
  icon: DesignAsset;
  iconID: string;
  onPress?: () => void;
  inline?: boolean;
  green?: boolean;
  grouped?: boolean;
  inlineEditor?: ReactNode;
};
/** Unimplemented actions are static rows, not buttons that claim to open an editor. */
export function SettingsRow({
  label,
  value,
  icon,
  iconID,
  onPress,
  inline = false,
  green = false,
  grouped = false,
  inlineEditor,
}: SettingsRowProps) {
  const text = settingsValueLabel(value);
  const artwork = (
    <View style={[styles.icon, green && styles.green]}>
      <DesignArtwork asset={icon} testID={iconID} />
    </View>
  );
  // A write/picker may only start from a known value (including a confirmed empty value).
  const action = value.state === 'ready' ? onPress : undefined;
  const row = action ? (
      <Button
        label={label}
        description={inline ? undefined : text}
        accessibilityLabel={`${label}. ${text}`}
        variant="secondary"
        onPress={action}
        leadingVisual={artwork}
        trailingVisual={
          <View style={styles.trailing}>
            {inline ? <Text style={styles.inline}>{text}</Text> : null}
            <View style={inlineEditor ? { transform: [{ rotate: '-90deg' }] } : undefined}><DesignArtwork asset={settingsAssets.chevron} testID="settings-chevron" /></View>
          </View>
        }
        style={[
          styles.row,
          inline && styles.inlineRow,
          (grouped || Boolean(inlineEditor)) && styles.grouped,
        ]}
        labelStyle={[styles.label, inline && styles.inlineLabel]}
        descriptionStyle={styles.value}
      />
    ) : (
    <View
      style={[
        styles.row,
        inline && styles.inlineRow,
        (grouped || Boolean(inlineEditor)) && styles.grouped,
      ]}
    >
      {artwork}
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        {!inline ? <Text style={styles.value}>{text}</Text> : null}
      </View>
      {inline ? <Text style={styles.inline}>{text}</Text> : null}
    </View>
  );
  return inlineEditor ? <View style={[styles.expanded, grouped && { borderWidth: 0 }]}>{row}<View style={styles.editor}>{inlineEditor}</View></View> : row;
}
const styles = StyleSheet.create({
  expanded: { borderWidth: 1, borderColor: colors.readableSuccess, borderRadius: 14, backgroundColor: 'white', overflow: 'hidden' },
  editor: { padding: 16, gap: 14, borderTopWidth: 1, borderTopColor: colors.divider },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  inlineRow: { paddingVertical: 10 },
  inlineLabel: { flex: 1 },
  grouped: { borderWidth: 0, borderRadius: 0 },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F5EDD8',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  green: { backgroundColor: '#E8F8ED' },
  text: { flex: 1, minWidth: 0, gap: 2 },
  label: {
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 20,
    color: colors.darkCanvas,
    textAlign: 'left',
    flexShrink: 1,
  },
  value: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 17,
    color: colors.muted,
  },
  inline: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 18,
    color: colors.muted,
    flexShrink: 1,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
});
