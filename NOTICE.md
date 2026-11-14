# NOTICE — materiale di terzi / third-party material

QUINE42 è sotto i termini di [`LICENSE.md`](LICENSE.md). Le parti elencate qui vengono da altri progetti e restano sotto la loro licenza. /
QUINE42 is under the terms in [`LICENSE.md`](LICENSE.md). The parts listed here come from other projects and stay under their license.

## MarkovJunior — © 2022 Maxim Gumin, MIT License

Fonte / Source: <https://github.com/mxgmn/MarkovJunior>

- `lab/mjx/official/*.xml` — i modelli dell'originale (`models/`), letti dal laboratorio / the original's models, read by the lab.
- `lab/mjx/official/resources/` — tileset, regole da file e campioni dell'originale portati in testo / the original's tilesets, rule
  files and samples converted to text (vedi / see `lab/mjx/official/resources/README.md`).
- `lab/mjx/official/riferimento/` — modelli di riferimento scaricati il 2026-11-03, con la loro `LICENSE` / reference models downloaded
  on 2026-11-03, with their `LICENSE`.
- `src/mj/` riscrive in TypeScript il linguaggio e gli algoritmi di MarkovJunior; nella misura in cui ne deriva, vale anche per esso la
  nota qui sotto. / `src/mj/` reimplements MarkovJunior's language and algorithms in TypeScript; to the extent it derives from it, the
  notice below applies to it as well.

```
MIT License

Copyright (c) 2022 Maxim Gumin

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Dipendenze / Dependencies

Le librerie in `package.json` (three.js, wasmoon, Vite e le altre) sono installate in `node_modules/` con le loro licenze e non fanno
parte di questo repository; la build (`dist/`) ne contiene parti, e chi la distribuisce porta anche le loro note. / The libraries in `package.json` (three.js, wasmoon, Vite and the rest) are installed in `node_modules/`
with their own licenses and are not part of this repository; the build (`dist/`) contains parts of them, and whoever distributes it carries their notices too.
