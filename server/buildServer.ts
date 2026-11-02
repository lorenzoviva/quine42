// How the production server is built (T133, ADR-0112): one file with what it needs, and the world's program in a folder of its own, which is all a world
// reads. Only here is Vite called; firebase-admin stays a dependency to install, and `vite` remains only as the import `buildWorld` makes if it is called, which here it never is.

import fs from 'node:fs';
import path from 'node:path';
import { buildWorld, PROGRAM_HEAD } from './worldHost';

export async function buildServer(root: string, outDir: string): Promise<{ server: string; world: string }> {
  const { build } = await import('vite');
  const out = path.resolve(root, outDir);
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  await build({
    configFile: false,
    envFile: false,
    root,
    logLevel: 'error',
    publicDir: false,
    ssr: { noExternal: true },
    build: {
      ssr: 'server/serve.ts',
      outDir: out,
      emptyOutDir: false,
      minify: false,
      reportCompressedSize: false,
      // What ws tries to load and does without.
      commonjsOptions: { ignoreDynamicRequires: true, ignore: ['bufferutil', 'utf-8-validate'] },
      rollupOptions: {
        external: ['vite', /^firebase-admin(\/|$)/],
        output: { entryFileNames: 'server.mjs', banner: PROGRAM_HEAD },
      },
    },
  });
  const world = await buildWorld(root, { outDir: path.join(out, 'mondo') });
  return { server: path.join(out, 'server.mjs'), world };
}
