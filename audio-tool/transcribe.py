#!/usr/bin/env python3
"""Transcribe audio recordings to text with an OpenAI-compatible speech-to-text API.

Usage:
    export OPENAI_API_KEY=sk-...
    python3 audio-tool/transcribe.py recording.m4a
    python3 audio-tool/transcribe.py a.mp3 b.wav -o transcripts --language ru --print

Standard library only, so there is nothing to install.
"""

import argparse
import json
import mimetypes
import os
import sys
import time
import urllib.error
import urllib.request
import uuid
from pathlib import Path

API_URL = os.environ.get(
    "TRANSCRIBE_API_URL", "https://api.openai.com/v1/audio/transcriptions"
)
DEFAULT_MODEL = os.environ.get("TRANSCRIBE_MODEL", "whisper-1")
MAX_UPLOAD_BYTES = 25 * 1024 * 1024  # API upload limit for a single file
RETRYABLE_STATUS = {429, 500, 502, 503, 504}
MAX_ATTEMPTS = 4


def build_multipart(fields: dict, file_field: str, file_path: Path):
    """Return (body, content_type) for a multipart/form-data request."""
    boundary = uuid.uuid4().hex
    chunks = []
    for name, value in fields.items():
        part = (
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="{name}"\r\n\r\n'
            f"{value}\r\n"
        )
        chunks.append(part.encode("utf-8"))
    mime = mimetypes.guess_type(file_path.name)[0] or "application/octet-stream"
    chunks.append(
        (
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="{file_field}"; '
            f'filename="{file_path.name}"\r\n'
            f"Content-Type: {mime}\r\n\r\n"
        ).encode("utf-8")
    )
    chunks.append(file_path.read_bytes())
    chunks.append(f"\r\n--{boundary}--\r\n".encode("utf-8"))
    return b"".join(chunks), f"multipart/form-data; boundary={boundary}"


def transcribe_file(path: Path, api_key: str, model: str, language, prompt) -> dict:
    fields = {"model": model, "response_format": "json"}
    if language:
        fields["language"] = language
    if prompt:
        fields["prompt"] = prompt

    body, content_type = build_multipart(fields, "file", path)

    for attempt in range(1, MAX_ATTEMPTS + 1):
        request = urllib.request.Request(
            API_URL,
            data=body,
            method="POST",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": content_type,
            },
        )
        try:
            with urllib.request.urlopen(request, timeout=600) as response:
                return json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as err:
            detail = err.read().decode("utf-8", errors="replace")
            if err.code in RETRYABLE_STATUS and attempt < MAX_ATTEMPTS:
                wait = 2 ** attempt
                print(f"  HTTP {err.code}, retrying in {wait}s...", file=sys.stderr)
                time.sleep(wait)
                continue
            raise RuntimeError(f"HTTP {err.code}: {detail}") from err
        except urllib.error.URLError as err:
            if attempt < MAX_ATTEMPTS:
                wait = 2 ** attempt
                print(f"  network error ({err.reason}), retrying in {wait}s...", file=sys.stderr)
                time.sleep(wait)
                continue
            raise RuntimeError(f"network error: {err.reason}") from err
    raise RuntimeError("unreachable")


def main() -> int:
    parser = argparse.ArgumentParser(description="Transcribe audio files to text.")
    parser.add_argument("files", nargs="+", type=Path, help="audio files to transcribe")
    parser.add_argument(
        "-o", "--out-dir", type=Path, default=Path("transcripts"),
        help="directory for the .txt and .json results (default: ./transcripts)",
    )
    parser.add_argument(
        "--language", default=None,
        help="ISO-639-1 language code, e.g. ru or en (improves accuracy when known)",
    )
    parser.add_argument(
        "--prompt", default=None,
        help="optional hint with names/terms likely to appear in the audio",
    )
    parser.add_argument("--model", default=DEFAULT_MODEL, help=f"model (default: {DEFAULT_MODEL})")
    parser.add_argument("--print", dest="print_text", action="store_true",
                        help="also print the transcript to stdout")
    args = parser.parse_args()

    api_key = os.environ.get("OPENAI_API_KEY") or os.environ.get("TRANSCRIBE_API_KEY")
    if not api_key:
        print("error: set OPENAI_API_KEY (or TRANSCRIBE_API_KEY) first.", file=sys.stderr)
        return 2

    args.out_dir.mkdir(parents=True, exist_ok=True)
    failures = 0

    for path in args.files:
        if not path.is_file():
            print(f"error: not a file: {path}", file=sys.stderr)
            failures += 1
            continue
        size = path.stat().st_size
        if size > MAX_UPLOAD_BYTES:
            print(
                f"error: {path} is {size / 1024 / 1024:.1f} MB; the API limit is 25 MB. "
                "Split it first, e.g. with: ffmpeg -i in.m4a -f segment -segment_time 900 -c copy part%03d.m4a",
                file=sys.stderr,
            )
            failures += 1
            continue

        print(f"Transcribing {path} ...", file=sys.stderr)
        try:
            result = transcribe_file(path, api_key, args.model, args.language, args.prompt)
        except RuntimeError as err:
            print(f"error: {path}: {err}", file=sys.stderr)
            failures += 1
            continue

        text = (result.get("text") or "").strip()
        stem = path.stem
        (args.out_dir / f"{stem}.txt").write_text(text + "\n", encoding="utf-8")
        (args.out_dir / f"{stem}.json").write_text(
            json.dumps({"source": str(path), "model": args.model, **result},
                       ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        print(f"  saved {args.out_dir / (stem + '.txt')}", file=sys.stderr)
        if args.print_text:
            print(text)

    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
