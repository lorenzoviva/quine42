// A real world's program (argv[2]) that also takes a few orders from the test, which the real one does not have: there is no way left to
// block a world from its own code for long (ADR-0105), and a test cannot wait for one.

process.on('message', (m) => {
  if (m?.t === 'sonda-blocca') for (;;);
  if (m?.t === 'sonda-gonfia') {
    const heap = [];
    for (;;) heap.push(new Array(1024).fill({}));
  }
  if (m?.t === 'sonda-guarda') {
    import('node:fs').then((fs) => {
      const tried = (fn) => {
        try {
          fn();
          return 'riuscito';
        } catch (e) {
          return String(e.code);
        }
      };
      process.send({ t: 'sonda-visto', env: Object.keys(process.env), lettura: tried(() => fs.readFileSync(m.segreto, 'utf8')), scrittura: tried(() => fs.writeFileSync(m.scrivi, 'x')), argv: process.argv });
    });
  }
});
await import(new URL(`file:///${process.argv[2].replace(/\\/g, '/')}`).href);
