// The fake world, taking its time to save when told to stop: a program with no arguments, as the sessions start it.

process.argv[2] = 'lento';
await import('./mondo-finto.mjs');
