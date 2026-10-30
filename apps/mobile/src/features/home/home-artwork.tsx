import { Image } from 'expo-image';
import { useState } from 'react';
import { View } from 'react-native';

import type { homeAssets } from '@/design/home-assets';

/** Fixed source bounds. A failed decoration disappears without replacing it with a glyph. */
export function HomeArtwork({
  asset,
  testID,
}: {
  asset: (typeof homeAssets)[keyof typeof homeAssets];
  testID?: string;
}) {
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
