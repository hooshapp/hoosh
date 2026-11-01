"""Audit redacted phone capture dimensions/hashes and native tab-corner regression."""
from pathlib import Path
import hashlib
import json
from PIL import Image

root = Path(__file__).parent

def pill_geometry(filename):
    image = Image.open(root / filename).convert('RGB')
    # Only the navigation band of the inspected normal-font Settings captures.
    def green(x, y):
        r, g, b = image.getpixel((x, y))
        return g > 130 and g > 1.8 * r and g > 1.3 * b
    pixels = [(x, y) for y in range(image.height - 250, image.height)
              for x in range(image.width) if green(x, y)]
    assert pixels, filename
    top = min(y for _, y in pixels)
    bottom = max(y for _, y in pixels)
    def span(y):
        xs = [x for x in range(image.width) if green(x, y)]
        return max(xs) - min(xs) + 1 if xs else 0
    near_top = span(top + 10)
    middle = span((top + bottom) // 2)
    return {'topInset10WidthPx': near_top, 'middleWidthPx': middle,
            'rounded': near_top < middle - 20}

before = pill_geometry('actual-settings.png')
after = pill_geometry('tab-pill-after.png')
assert not before['rounded'], before
assert after['rounded'], after
captures = []
for path in sorted(root.glob('*.png')):
    with Image.open(path) as image:
        assert image.size == (1344, 2697), (path.name, image.size)
    captures.append({'file': path.name, 'pixels': [1344, 2697],
                     'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
report = {'physicalDevice': 'Pixel 8 Pro', 'signedStandaloneBuild': False,
          'nativePillBefore': before, 'nativePillAfter': after, 'captures': captures}
(root / 'capture-audit.json').write_text(json.dumps(report, indent=2) + '\n')
print(f'{len(captures)} phone captures audited; square-to-rounded tab regression verified.')
