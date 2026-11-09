"""Логотип NEXA GROUP: знак-оргсхема + надпись NEXA (Unbounded 700) и GROUP (IBM Plex Mono 500).
Буквы переводятся в кривые, чтобы логотип не зависел от установленных шрифтов.
Шрифты под лицензией SIL OFL 1.1 — использование в логотипе разрешено."""
import sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

FONTS, OUT = sys.argv[1], sys.argv[2]
INK, ACCENT, ACCENT_DARK, MUTED = "#101827", "#0F766E", "#5FC4B8", "#64748B"


def text_path(font_file, text, size, x0, baseline, tracking=0.0):
    f = TTFont(font_file)
    gs, cmap, hmtx = f.getGlyphSet(), f.getBestCmap(), f["hmtx"]
    upm = f["head"].unitsPerEm
    k = size / upm
    pen = SVGPathPen(gs)
    x = x0
    for ch in text:
        g = cmap[ord(ch)]
        tp = TransformPen(pen, (k, 0, 0, -k, x, baseline))
        gs[g].draw(tp)
        x += hmtx[g][0] * k + tracking
    return pen.getCommands(), x - tracking


def mark(accent, ink, x=0, y=0, s=1.0):
    """Знак: собственник (залитый) → три отдела, средний — акцентный."""
    sw = 2.6
    return f'''<g transform="translate({x} {y}) scale({s})" fill="none" stroke="{ink}" stroke-width="{sw}" stroke-linejoin="round">
  <rect x="13.5" y="1.3" width="13" height="9.5" rx="1.6" fill="{ink}"/>
  <path d="M20 10.8V18M5.3 18H34.7M5.3 18V23.4M20 18V23.4M34.7 18V23.4" stroke-linecap="square"/>
  <rect x="1.3" y="23.4" width="8" height="13.3" rx="1.6"/>
  <rect x="16" y="23.4" width="8" height="13.3" rx="1.6" fill="{accent}" stroke="{accent}"/>
  <rect x="30.7" y="23.4" width="8" height="13.3" rx="1.6"/>
</g>'''


def lockup(ink, accent, sub):
    nexa, end = text_path(f"{FONTS}/unbounded-700.ttf", "NEXA", 36, 54, 32.5, tracking=-0.6)
    group, gend = text_path(f"{FONTS}/plexmono-500.ttf", "GROUP", 11, end + 10, 32.5, tracking=2.4)
    w = round(gend + 2)
    return w, f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} 40" width="{w * 4}" height="160" role="img" aria-label="NEXA GROUP">
{mark(accent, ink)}
<path d="{nexa}" fill="{ink}"/>
<path d="{group}" fill="{sub}"/>
</svg>
'''


w, light = lockup(INK, ACCENT, MUTED)
open(f"{OUT}/logo.svg", "w").write(light)
_, dark = lockup("#FFFFFF", ACCENT_DARK, "#C3CBD8")
open(f"{OUT}/logo-white.svg", "w").write(dark)

# Иконка: знак на тёмном квадрате (favicon, аватар соцсетей)
icon = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="512" height="512" role="img" aria-label="NEXA GROUP">
<rect width="64" height="64" rx="12" fill="{INK}"/>
{mark(ACCENT_DARK, "#FFFFFF", x=12, y=12.5, s=1.0)}
</svg>
'''
open(f"{OUT}/icon.svg", "w").write(icon)
print("ok", w)
