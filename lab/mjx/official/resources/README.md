# Le risorse di MarkovJunior in testo (T335)

Tileset (`<nome>.xml` con le tessere dentro), regole da file (`<cartella>-<nome>.txt`) e campioni (`<nome>.txt`) del repository di
MarkovJunior (github.com/mxgmn/MarkovJunior: `resources/tilesets/`, `resources/rules/`, `resources/samples/`), portati dai loro `.vox` e
`.png` al testo che il motore legge (regola 11, ADR-0174) da `lab/scripts/mjx-risorse.ts`, con i colori stesi sulle lettere nell'ordine
in cui compaiono, come fa l'originale. Ogni file dice da dove viene. Li leggono i modelli di `lab/mjx/official/` (e, nel laboratorio, i
programmi scritti lì); nella build dei giocatori non ci sono.

Copyright (C) 2022 Maxim Gumin. Licenza MIT:

> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the
> "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge,
> publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so,
> subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
> MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR
> ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH
> THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
