# Audio tool — расшифровка аудиозаписей

Простой CLI-инструмент: берёт аудиофайл (m4a, mp3, wav, ogg, webm, flac, mp4…)
и возвращает текст расшифровки. Использует OpenAI speech-to-text API.
Зависимости не нужны — только Python 3.8+ из стандартной библиотеки.

## Быстрый старт

```bash
export OPENAI_API_KEY=sk-...          # ключ от OpenAI

python3 audio-tool/transcribe.py запись.m4a
python3 audio-tool/transcribe.py a.mp3 b.wav --language ru --print
```

Результаты сохраняются в `transcripts/` (или в папку из `-o`):

- `<имя>.txt` — готовый текст;
- `<имя>.json` — полный ответ API с метаданными.

## Опции

| Опция | Описание |
|---|---|
| `-o, --out-dir DIR` | куда сохранять результаты (по умолчанию `./transcripts`) |
| `--language ru` | код языка ISO-639-1; укажите, если знаете язык — точнее |
| `--prompt "..."` | подсказка с именами и терминами, которые звучат в записи |
| `--model NAME` | модель (по умолчанию `whisper-1`, см. `TRANSCRIBE_MODEL`) |
| `--print` | дополнительно вывести текст в консоль |

Переменные окружения:

- `OPENAI_API_KEY` (или `TRANSCRIBE_API_KEY`) — обязательна;
- `TRANSCRIBE_MODEL` — модель по умолчанию;
- `TRANSCRIBE_API_URL` — свой OpenAI-совместимый endpoint.

## Ограничения

- Один файл не должен превышать **25 МБ** (лимит API). Для длинных записей
  разбейте файл, например:
  ```bash
  ffmpeg -i long.m4a -f segment -segment_time 900 -c copy part%03d.m4a
  ```
- Ретраи встроены для ошибок 429/5xx и сетевых сбоев.

## Пример: несколько записей сразу

```bash
python3 audio-tool/transcribe.py records/*.m4a -o transcripts --language ru
```
