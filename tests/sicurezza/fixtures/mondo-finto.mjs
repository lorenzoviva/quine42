// A world that does nothing but speak the channel (src/session/worldwire.ts): how the watcher behaves, without booting a kernel each time.
// argv[2]: `pronto` it opens and beats (`lento`: and takes its time to save), `muore` it opens and dies at once, `errore` it says it cannot open,
// `apre-e-muore`: it takes argv[3] ms to open, beats, and dies argv[4] ms later.

const mode = process.argv[2];
process.on('disconnect', () => process.exit(0));
process.on('message', (m) => {
  if (m?.t === 'apri') {
    if (mode === 'errore') return process.send({ t: 'errore', motivo: 'non si apre' });
    process.send({ t: 'visto', open: m.open });
    if (mode === 'apre-e-muore') {
      return void setTimeout(() => {
        process.send({ t: 'pronto' });
        setInterval(() => process.send({ t: 'vivo', tick: 1 }), 20);
        setTimeout(() => process.exit(1), Number(process.argv[4]));
      }, Number(process.argv[3]));
    }
    process.send({ t: 'pronto' });
    if (mode === 'muore') return setTimeout(() => process.exit(1), 20);
    setInterval(() => process.send({ t: 'vivo', tick: 1 }), 20);
  }
  if (m?.t === 'chiedi') process.send({ t: 'risposta', id: m.id, ok: true, value: true });
  if (m?.t === 'sonda-muori') process.exit(1);
  if (m?.t === 'sonda-blocca') for (;;);
  if (m?.t === 'ferma') setTimeout(() => process.exit(0), mode === 'lento' ? 400 : 0);
});
