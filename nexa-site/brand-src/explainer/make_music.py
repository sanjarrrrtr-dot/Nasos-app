"""Фоновая музыка, сгенерированная с нуля: мягкий пэд + тихое арпеджио, 70 BPM.
Без сэмплов и чужих треков. Аргументы: длительность (сек), путь к wav."""
import sys, wave
import numpy as np

DUR, OUT = float(sys.argv[1]), sys.argv[2]
SR = 44100
t = np.arange(int(DUR * SR)) / SR
A4 = 440.0
def hz(n): return A4 * 2 ** ((n - 69) / 12)  # MIDI → Гц

# Аккорды: Am — F — C — G (по 4 такта при 70 BPM ≈ 3,43 с на аккорд)
CH = [[57, 60, 64, 69], [53, 57, 60, 65], [48, 55, 60, 64], [55, 59, 62, 67]]
bar = 60 / 70 * 4
seg = bar
out = np.zeros_like(t)

def env(x, a, r, length):
    e = np.ones_like(x)
    e = np.minimum(e, x / a)
    e = np.minimum(e, np.clip((length - x) / r, 0, 1))
    return np.clip(e, 0, 1)

i = 0
pos = 0.0
while pos < DUR:
    notes = CH[i % len(CH)]
    s0, s1 = int(pos * SR), min(int((pos + seg + 1.2) * SR), len(t))
    x = t[s0:s1] - pos
    e = env(x, 1.2, 1.4, seg + 1.2)
    for n in notes:
        f = hz(n)
        # пэд: мягкий тембр из основного тона и слабых обертонов с лёгкой расстройкой
        w = (np.sin(2 * np.pi * f * x) + 0.35 * np.sin(2 * np.pi * f * 2.003 * x) + 0.12 * np.sin(2 * np.pi * f * 3.01 * x))
        out[s0:s1] += 0.06 * e * w
    # арпеджио восьмыми, очень тихо
    step = 60 / 70 / 2
    for k in range(int(seg / step)):
        st = pos + k * step
        n = notes[k % len(notes)] + 12
        a0, a1 = int(st * SR), min(int((st + 1.0) * SR), len(t))
        y = t[a0:a1] - st
        out[a0:a1] += 0.035 * np.exp(-y * 5) * np.sin(2 * np.pi * hz(n) * y)
    pos += seg
    i += 1

# плавное появление и затухание всего трека, нормализация
fade = np.minimum(1, np.minimum(t / 2.0, (DUR - t) / 3.0))
out *= np.clip(fade, 0, 1)
out /= np.max(np.abs(out)) + 1e-9
out *= 0.5
# стерео: лёгкое расширение задержкой
left = out
right = np.concatenate([np.zeros(int(0.012 * SR)), out])[: len(out)]
data = (np.stack([left, right], axis=1) * 32767).astype(np.int16)
with wave.open(OUT, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(data.tobytes())
print("music", DUR)
