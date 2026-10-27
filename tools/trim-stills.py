#!/usr/bin/env python3
"""Trim transparent padding from the rendered stills and encode WebP. Pass model names to limit.
Pin JSON written by render-stills.cjs (canvas px) is converted to percentages of the trimmed image."""
import json, pathlib, subprocess, sys
from PIL import Image
only = set(sys.argv[1:])
root = pathlib.Path(__file__).resolve().parent.parent / 'public/models/still'
for p in sorted(root.glob('*.png')):
    if only and p.stem not in only: continue
    im = Image.open(p).convert('RGBA'); b = im.getchannel('A').getbbox(); im.crop(b).save(p)
    pins = p.with_name(p.stem + '-pins.json')
    if pins.exists():
        d = json.loads(pins.read_text()); w, h = b[2] - b[0], b[3] - b[1]
        d = {'pins': [{'text': q['text'], 'x': round((q['x'] - b[0]) / w * 100, 2), 'y': round((q['y'] - b[1]) / h * 100, 2)} for q in d['pins']]}
        pins.write_text(json.dumps(d, indent=2) + '\n')
    subprocess.run(['cwebp', '-q', '82', '-alpha_q', '90', str(p), '-o', str(p.with_suffix('.webp'))], check=True, capture_output=True)
    p.unlink(); print('still', p.stem, Image.open(p.with_suffix('.webp')).size)
