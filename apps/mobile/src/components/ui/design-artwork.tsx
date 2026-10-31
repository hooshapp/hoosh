import { Image } from 'expo-image';
import { useState, type ComponentProps } from 'react';
import { View } from 'react-native';

export type DesignAsset = Readonly<{
  source: NonNullable<ComponentProps<typeof Image>['source']>;
  width: number;
  height: number;
}>;
/** Decorative original artwork, unchanged source bounds and no replacement glyph. */
export function DesignArtwork({ asset, testID }: { asset: DesignAsset; testID?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <View style={{ width: asset.width, height: asset.height, flexShrink: 0 }}>
      {!failed ? (
        <Image
          source={asset.source}
          contentFit="contain"
          accessible={false}
          accessibilityElementsHidden
          aria-hidden
          testID={testID}
          onError={() => setFailed(true)}
          style={{ width: asset.width, height: asset.height }}
        />
      ) : null}
    </View>
  );
}
