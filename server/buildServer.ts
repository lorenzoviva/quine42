// How the production server is built (T133, ADR-0112): one file with what it needs, and the world's program in a folder of its own, which is all a world
// reads; beside them the owner's command of a server without Firebase (`inviti.mjs`, ADR-0194), so the package needs no vite-node (T367, ADR-0203).
// Only here is Vite called; firebase-admin stays a dependency to install, and `vite` remains only as the import `buildWorld` makes if it is called, which here it never is.

import fs from 'node:fs';
import path from 'node:path';
import { buildWorld, PROGRAM_HEAD } from './worldHost';

export async function buildServer(root: string, outDir: string): Promise<{ server: string; world: string; invites: string }> {
  const out = path.resolve(root, outDir);
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  await bundle(root, out, 'server/serve.ts', 'server.mjs');
  // `node dist-server/inviti.mjs padrone|elenco|revoca`: the same as `npm run inviti`, where only the package is (a container).
  await bundle(root, out, 'tools/inviti/cli.ts', 'inviti.mjs');
  const world = await buildWorld(root, { outDir: path.join(out, 'mondo') });
  return { server: path.join(out, 'server.mjs'), world, invites: path.join(out, 'inviti.mjs') };
}

/** One program of the server's package, whole but for firebase-admin (installed) and vite (never called). */
async function bundle(root: string, out: string, entry: string, file: string): Promise<void> {
  const { build } = await import('vite');
  await build({
    configFile: false,
    envFile: false,
    root,
    logLevel: 'error',
    publicDir: false,
    ssr: { noExternal: true },
    build: {
      ssr: entry,
      outDir: out,
      emptyOutDir: false,
      minify: false,
      reportCompressedSize: false,
      // What ws tries to load and does without.
      commonjsOptions: { ignoreDynamicRequires: true, ignore: ['bufferutil', 'utf-8-validate'] },
      rollupOptions: {
        external: ['vite', /^firebase-admin(\/|$)/],
        output: { entryFileNames: file, banner: PROGRAM_HEAD },
      },
    },
  });
}
