#!/usr/bin/env python3
"""Inserts the shuffle preamble (`mescola`) into a program of the bench: a hidden strip at the top of the box, half of it erased
at random (`prl`), the rest erased by an `all` that shuffles its matches. The `all` consumes as many draws as cells are left,
a number that changes with the seed: every choice after it is drawn at another point of the generator for every seed.
(The engine's mulberry32 gives close values at the same draw for consecutive seeds 1..5, so a die thrown at the same draw
tends to fall the same way for neighbouring seeds.)

    python3 lab/banco/seme-procedurale/mescola.py <file.xml> <X> <Y> <Z> [lettera]
"""
import re, sys
path, X, Y, Z = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4])
letter = sys.argv[5] if len(sys.argv) > 5 else '0'
s = open(path, encoding='utf8').read()
if 'name="mescola"' in s:
    sys.exit(0)
m = re.search(r'values="([^"]*)"', s)
if letter in m.group(1):
    sys.exit(f'{letter} già usata in values')
s = s[:m.start(1)] + m.group(1) + letter + s[m.end(1):]
colors = list(re.finditer(r'\n(\s*)<color [^>]*/>', s))
last = colors[-1]
ind = last.group(1)
pre = (f'\n{ind}<color symbol="{letter}" hidden="True" name="mescola"/>'
       f'\n{ind}<!-- Mescola: il generatore riparte da un punto diverso per ogni seme (vedi README) -->'
       f'\n{ind}<box at="{X // 2} 0 {Z - 1}" size="{X} 2 1" color="{letter}"/>'
       f'\n{ind}<prl in="{letter}" out="B" p="0.5" steps="1"/>'
       f'\n{ind}<all in="{letter}" out="B"/>')
s = s[:last.end()] + pre + s[last.end():]
open(path, 'w', encoding='utf8').write(s)
