# Исходники логотипа и видео

Логотип и видео созданы с нуля для NEXA GROUP. Сторонних изображений и видео нет.
Шрифты Unbounded, Inter и IBM Plex Mono распространяются по лицензии SIL Open Font License 1.1,
она разрешает использовать их в логотипе и видео.

## Логотип — `make_logo.py`
Рисует знак-оргсхему и переводит буквы NEXA / GROUP в кривые.
Нужны `fonttools` и `brotli`, а также TTF-файлы шрифтов в папке `fonts/`
(`unbounded-700.ttf`, `plexmono-500.ttf`; их можно получить из `node_modules/@fontsource/*/files/*.woff2`).

    python3 make_logo.py fonts ../public/brand

Готовые файлы лежат в `public/brand/`: `logo.svg` (светлый фон), `logo-white.svg` (тёмный фон),
`icon.svg` (иконка, аватар), PNG-версии.

## Видео — `video-scene.html`
12-секундная анимация «От хаоса к системе». Функция `render(t)` рисует кадр для момента `t` в секундах.
Кадры снимаются через Playwright (30 кадров в секунду), затем собираются ffmpeg:

    ffmpeg -framerate 30 -i frames/f%04d.png -c:v libx264 -crf 24 -pix_fmt yuv420p -movflags +faststart out.mp4

Рядом со сценой должны лежать папка `fonts/` (woff2) и `logo-white.svg`.
Готовое видео: `public/media/nexa-chaos-to-system.mp4`.
