"""Optional asset maintenance. Requires Pillow, not part of the npm build.

Uses installed open-source Nimbus fonts. Override SHARE_SERIF / SHARE_SANS
with equivalent local font paths. The checked-in PNGs are ready to deploy.
"""
import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SERIF = os.environ.get('SHARE_SERIF', '/usr/share/fonts/opentype/urw-base35/NimbusRoman-Regular.otf')
SANS = os.environ.get('SHARE_SANS', '/usr/share/fonts/opentype/urw-base35/NimbusSans-Regular.otf')
SCALE = 2
PAPER, INK, ACCENT, MUTED = '#faf7f1', '#173532', '#c45d41', '#68736e'

def font(path, size):
    return ImageFont.truetype(path, size * SCALE)

def center(draw, text, y, face, fill):
    draw.text((600 * SCALE, y * SCALE), text, font=face, fill=fill, anchor='mt')

for kind, locale, caption in [
    ('request', 'en', 'Share your favourite places.'),
    ('request', 'pl', 'Podziel się ulubionymi miejscami.'),
    ('guide', 'en', 'Places recommended by friends.'),
    ('guide', 'pl', 'Miejsca polecane przez znajomych.'),
]:
    image = Image.new('RGB', (1200 * SCALE, 630 * SCALE), PAPER)
    draw = ImageDraw.Draw(image)
    center(draw, 'Anyone’s', 120, font(SERIF, 112), INK)
    center(draw, 'Guide', 232, font(SERIF, 112), INK)
    # The app's four-segment BrandSignature path, scaled without changing it.
    segments = [
        ((3, 9.4), (8.2, 9.4), (9.1, 3.8), (14.2, 3.8)),
        ((14.2, 3.8), (19.6, 3.8), (19.7, 11.9), (25.4, 11.9)),
        ((25.4, 11.9), (31, 11.9), (31.5, 4.1), (37.2, 4.1)),
        ((37.2, 4.1), (41.7, 4.1), (42.9, 8.3), (49, 8.3)),
    ]
    points = []
    for a, b, c, d in segments:
        for step in range(51):
            t = step / 50
            x, y = [((1-t)**3*a[i] + 3*(1-t)**2*t*b[i] + 3*(1-t)*t*t*c[i] + t**3*d[i]) for i in range(2)]
            points.append(((600 + (x-26)*4.5) * SCALE, (355 + y*4.5) * SCALE))
    draw.line(points, fill=ACCENT, width=5*SCALE, joint='curve')
    face = font(SANS, 36)
    while draw.textlength(caption, font=face) > 560*SCALE:
        face = font(SANS, face.size // SCALE - 1)
    center(draw, caption, 455, face, INK)
    center(draw, 'anyones.guide', 549, font(SANS, 26), MUTED)
    output = ROOT / 'public' / 'social' / f'{kind}-{locale}-v083.png'
    output.parent.mkdir(parents=True, exist_ok=True)
    image.resize((1200, 630), Image.Resampling.LANCZOS).save(output, optimize=True)
    print(f'{output.name}: {output.stat().st_size} bytes')
