// npm run build:server (T133, ADR-0112): dist-server/server.mjs and the program of the worlds in dist-server/mondo/. The client's build is `npm run build`.

import { buildServer } from '../../server/buildServer';

await buildServer(process.cwd(), 'dist-server');
console.log('dist-server/ pronta');
