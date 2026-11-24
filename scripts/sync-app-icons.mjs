// Generate native launcher sizes from the original Swift Hoosh dinosaur artwork.
// Canonical artwork restored from commit 44b0702 (Swift AppIcon-1024.png).
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateImageAsync } from '@expo/image-utils';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mobile = path.join(root, 'apps/mobile');
const source = path.join(mobile, 'assets/branding/app-icon.png');
async function resize(destination, size) {
  const image = await generateImageAsync({ projectRoot: mobile, cacheType: 'hoosh-app-icon' },
    { src: source, width: size, height: size, resizeMode: 'contain', removeTransparency: true, backgroundColor: '#292929' });
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, image.source);
}
const catalog = path.join(mobile, 'ios/DisconnectApp/Assets.xcassets/AppIcon.appiconset');
const contents = JSON.parse(await fs.readFile(path.join(catalog, 'Contents.json'), 'utf8'));
for (const item of contents.images) {
  const size = Number(item.size.split('x')[0]) * Number(item.scale.replace('x', ''));
  await resize(path.join(catalog, item.filename), size);
}
const resources = path.join(mobile, 'android/app/src/main/res');
for (const [density, size] of Object.entries({ mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 })) {
  for (const name of ['ic_launcher', 'ic_launcher_round']) {
    await resize(path.join(resources, `mipmap-${density}`, `${name}.png`), size);
    await fs.rm(path.join(resources, `mipmap-${density}`, `${name}.webp`), { force: true });
  }
}
await resize(path.join(resources, 'drawable-nodpi/hoosh_launcher_foreground.png'), 432);
await fs.mkdir(path.join(resources, 'mipmap-anydpi-v26'), { recursive: true });
for (const name of ['ic_launcher', 'ic_launcher_round']) {
  await fs.writeFile(path.join(resources, 'mipmap-anydpi-v26', `${name}.xml`), `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
  <background android:drawable="@color/hoosh_icon_background" />
  <foreground android:drawable="@drawable/hoosh_launcher_foreground" />
</adaptive-icon>
`);
}
await fs.writeFile(path.join(resources, 'values/hoosh_app_icon.xml'), '<?xml version="1.0" encoding="utf-8"?>\n<resources><color name="hoosh_icon_background">#292929</color></resources>\n');
console.log('Updated 18 iOS, 10 Android legacy and 2 Android adaptive launcher icons.');
