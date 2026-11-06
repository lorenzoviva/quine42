// A fake program for the checker of the handmade cards (T293, ADR-0161), started as programCheck.ts starts the program of the worlds: it
// does what its argument says when it is asked `check`. No imports: under Node's permission model it reads only its own folder.

const mode = process.argv[2] ?? 'ok';

process.on('message', (m) => {
  if (m?.t !== 'check') return;
  const say = (errors) => process.send({ t: 'checked', id: m.id, errors });
  switch (mode) {
    case 'muto':
      return;
    case 'muore':
      return process.exit(3);
    case 'memoria': {
      const kept = [];
      for (;;) kept.push(new Array(1e6).fill(Math.random()));
    }
    case 'ambiente':
      // Short lines: what comes back is cut at 500 characters and 20 lines.
      return say([`env:${Object.keys(process.env).join(',')}`, ...Object.values(process.env).map((v) => `val:${String(v).slice(0, 200)}`), ...process.execArgv.map((f) => `arg:${f.slice(0, 400)}`)]);
    case 'lento':
      return setTimeout(() => say([]), 400);
    case 'ostile':
      return say([...Array.from({ length: 100 }, () => 'x'.repeat(5000)), 42, { t: 'altro' }]);
    case 'altro':
      return process.send({ t: 'checked', id: m.id + 1, errors: [] });
    default:
      return say([]);
  }
});
process.on('disconnect', () => process.exit(0));
