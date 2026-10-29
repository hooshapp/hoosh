import { navigationAssets } from '@/design/navigation-assets';
import { mascotAssets, mascotBounds } from '@/design/mascot-assets';

/** A source inventory, not a product screen or an inferred health state. */
export function AssetGallery() {
  return (
    <section className="asset-gallery" aria-label="Original Figma asset inventory">
      <h2>Original artwork inventory</h2>
      <p>Source variants only. No score, mood, credits or installed protection is inferred.</p>
      <div className="asset-grid">
        {Object.entries(navigationAssets).flatMap(([name, asset]) =>
          (['active', 'inactive'] as const).map((state) => (
            <figure
              key={`${name}-${state}`}
              className={`icon-swatch ${state === 'active' ? 'icon-swatch-active' : ''}`}>
              <img
                src={String(asset[state])}
                width={asset.width}
                height={asset.height}
                alt={`${name} ${state} source icon`}
              />
              <figcaption>
                {name} / {state}
              </figcaption>
            </figure>
          )),
        )}
        {Object.entries(mascotAssets).map(([name, source]) => (
          <figure key={name}>
            <img
              src={String(source)}
              width={mascotBounds.width}
              height={mascotBounds.height}
              alt={`Dino source: ${name}`}
            />
            <figcaption>{name} — unscored artwork</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
