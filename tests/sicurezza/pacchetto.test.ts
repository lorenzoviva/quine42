// The package of the self-hosting (T367, ADR-0201; open-beta.md § 5 points 6-7): the image has no secret and no universe, the server in it never runs
// as root, the port is published only on this machine unless said, the example of `.env` has no real value, and the image carries the kernel's
// version it was built for, checked against the code. Read from the files: the image itself is built by `npm run immagine`, not here.

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { productionProblems } from '../../server/production';
import { KERNEL_VERSION } from '../../src/kernel/version';

const read = (f: string) => readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const DOCKERFILE = read('Dockerfile');
const IGNORE = read('.dockerignore').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
const COMPOSE = read('docker-compose.yml');
const EXAMPLE = read('.env.example');
const START = read('tools/produzione/immagine/avvio.sh');
const INVITES = read('tools/produzione/immagine/inviti.sh');
const IMAGE_SCRIPT = read('tools/produzione/immagine.mjs');

/** The pairs of `.env.example`, as Node and compose read them: one per line, comments on lines of their own. */
function example(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of EXAMPLE.split('\n')) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const m = /^([A-Z][A-Z0-9_]*)=(.*)$/.exec(line);
    expect(m, `una riga che non è NOME=valore: ${line}`).toBeTruthy();
    out[m![1]] = m![2];
  }
  return out;
}

/** The stage that runs: what follows the last FROM. */
const finalStage = () => DOCKERFILE.slice(DOCKERFILE.lastIndexOf('\nFROM '));

describe('il pacchetto del self-hosting', () => {
  it('V-041 nell’immagine non entra nessun segreto, nessun universo, niente di questa macchina', () => {
    for (const p of ['.env', '.env.*', '**/.env', 'universes/', 'node_modules/', 'dist/', 'dist-server/', '.git/', '.claude/', '.pipeline/', 'backup/']) expect(IGNORE, p).toContain(p);
    // The example is the only `.env…` let in, and the rule that lets it in comes after the one that keeps the others out.
    expect(IGNORE.filter((l) => l.startsWith('!'))).toEqual(['!.env.example']);
    expect(IGNORE.indexOf('!.env.example')).toBeGreaterThan(IGNORE.indexOf('.env.*'));
    // Nothing copies a `.env` or the universes by name, and no secret is written in the image's environment or arguments.
    for (const line of DOCKERFILE.split('\n').filter((l) => /^\s*(COPY|ADD)\b/.test(l))) {
      expect(line, line).not.toMatch(/\.env\b|universes\//);
      expect(line, line).not.toMatch(/^\s*ADD\s+https?:/);
    }
    expect(DOCKERFILE).not.toMatch(/^\s*(ENV|ARG)\b[^\n]*(KEY|SEGRETO|SECRET|TOKEN|PASSWORD)/im);
    // What runs gets only the two builds, the installed dependencies, the labs' switch and the two scripts; not the sources.
    const copies = finalStage().split('\n').filter((l) => /^\s*COPY\b/.test(l));
    expect(copies.some((l) => /COPY\s+\.\s/.test(l))).toBe(false);
    expect(copies.join('\n')).toMatch(/--from=build \/src\/dist \.\/dist/);
    expect(copies.join('\n')).toMatch(/--from=build \/src\/dist-server \.\/dist-server/);
  });

  it('V-041 il server non gira come root: l’avvio dà il volume a node e scende, il comando degli inviti anche', () => {
    expect(finalStage()).toMatch(/ENTRYPOINT \["\/usr\/bin\/tini", "--", "\/usr\/local\/bin\/quine-avvio"\]/);
    expect(finalStage()).toMatch(/CMD \["node", "dist-server\/server\.mjs"\]/);
    expect(finalStage()).not.toMatch(/^\s*USER\s+root/m);
    // As root only to give the folder away, then exec as node; any other user goes straight on.
    expect(START).toMatch(/chown -R node:node "\$dir"/);
    expect(START).toMatch(/exec setpriv --reuid=node --regid=node --init-groups "\$@"/);
    expect(START.trim().split('\n').pop()).toBe('exec "$@"');
    expect(INVITES).toMatch(/exec setpriv --reuid=node --regid=node --init-groups node \/app\/dist-server\/inviti\.mjs "\$@"/);
    expect(finalStage()).toMatch(/HEALTHCHECK[\s\S]*\/healthz/);
  });

  it('V-041 l’immagine ha l’etichetta della versione del kernel, controllata sul codice, mai solo latest', () => {
    // The build stops without a version, or with one that is not the code's.
    expect(DOCKERFILE).toMatch(/test -n "\$KERNEL_VERSION" \|\|/);
    expect(DOCKERFILE).toMatch(/v="\$\(node -p "require\('\.\/package\.json'\)\.version"\)"/);
    expect(DOCKERFILE).toMatch(/test "\$v" = "\$KERNEL_VERSION" \|\|/);
    expect(finalStage()).toMatch(/quine42\.kernel="\$KERNEL_VERSION"/);
    expect(finalStage()).toMatch(/org\.opencontainers\.image\.version="\$KERNEL_VERSION"/);
    // The base is pinned to the Node the server is built and tested on, not a moving tag.
    for (const from of DOCKERFILE.match(/^FROM .*/gm) ?? []) expect(from).toMatch(/^FROM node:22-bookworm-slim\b/);
    // The script tags with the version and the contract; compose builds and names the image from QUINE_KERNEL.
    expect(IMAGE_SCRIPT).toMatch(/`quine42:\$\{version\}`/);
    expect(IMAGE_SCRIPT).toMatch(/`quine42:\$\{contract\}`/);
    expect(IMAGE_SCRIPT).not.toMatch(/:latest/);
    expect(COMPOSE).toMatch(/image: quine42:\$\{QUINE_KERNEL:\?/);
    expect(COMPOSE).toMatch(/KERNEL_VERSION: \$\{QUINE_KERNEL:\?/);
    expect(JSON.parse(read('package.json')).version).toBe(KERNEL_VERSION);
  });

  it('V-041 compose pubblica la porta solo su questa macchina se non è detto, e i segreti arrivano dal .env all’avvio', () => {
    expect(COMPOSE).toMatch(/- "\$\{QUINE_PUBBLICA_SU:-127\.0\.0\.1\}:\$\{QUINE_PUBBLICA_PORTA:-8080\}:8080"/);
    expect(COMPOSE).toMatch(/env_file: \.env/);
    expect(COMPOSE).toMatch(/- universi:\/app\/universes\n/);
    // The backup reads the volume and does not write it.
    expect(COMPOSE).toMatch(/- universi:\/app\/universes:ro/);
    expect(example().QUINE_PUBBLICA_SU).toBe('127.0.0.1');
  });

  it('V-041 l’esempio del .env non ha valori veri: ogni chiave, segreto e token è vuoto, e il server con l’esempio non parte finché il segreto manca', () => {
    const env = example();
    for (const [k, v] of Object.entries(env)) if (/KEY|SEGRETO|SECRET|TOKEN|PASSWORD|PROJECT_ID|AUTH_DOMAIN/.test(k)) expect(v, k).toBe('');
    expect(env.QUINE_KERNEL).toBe('');
    // The open beta, said; who verifies identities, said.
    expect(env.QUINE_PAGAMENTI).toBe('spenti');
    expect(env.QUINE_ACCOUNT).toBe('inviti');
    // As it is, the server says what is missing, and only that; with a secret written it has nothing to say.
    expect(productionProblems(env)).toEqual([expect.stringMatching(/^QUINE_SEGRETO_INVITI:/)]);
    expect(productionProblems({ ...env, QUINE_SEGRETO_INVITI: 'x'.repeat(16) + 'y'.repeat(16) + 'z'.repeat(8) })).toEqual([]);
  });
});
