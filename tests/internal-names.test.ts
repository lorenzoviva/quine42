// The table of the internal language (T306, ADR-0153): no doubles, no collisions with the English already used, every Italian value the
// code compares is in it, and docs/lingua-interna.md says every entry.
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { INTERNAL_NAMES, internalName, type NameDomain } from '../src/kernel/internalNames';
import { CLASSES, SIZE_TIERS } from '../src/mj/classes';
import { PARTS } from '../src/mj/engine';
import { VIEWS } from '../src/mj/photo';
import { EFFECT_TYPES, ITEM_CATEGORIES } from '../src/kernel/types';
import { ITEM_SHAPES } from '../src/kernel/modeldirector';
import { STAMP_SHAPES } from '../src/kernel/stamps';
import { ACTIVITIES, DAY_PHASES, WHERES } from '../src/kernel/npc/society';
import { JOB_BEHAVIOURS } from '../src/kernel/npc/jobs';
import { VENTURE_TYPES } from '../src/kernel/npc/ventures';
import { SCULPTOR_CLASSES } from '../src/kernel/universe';
import { COEFFICIENT_KEYS } from '../src/kernel/coefficients';
import { ENTITY_PARTS } from '../src/session/protocol';
import { LUA_API } from '../src/kernel/validator';

const ROOT = path.resolve(__dirname, '..');
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const json = (rel: string) => JSON.parse(read(rel).replace(/^﻿/, ''));
const domain = (id: string): NameDomain => {
  const found = INTERNAL_NAMES.find((x) => x.id === id);
  if (!found) throw new Error(`manca il dominio ${id}`);
  return found;
};
const keys = (id: string) => Object.keys(domain(id).names);
/** The names a domain has in the code: the internal ones when its step is done (T307a, T307b), the Italian ones of today otherwise. */
const DONE = new Set(['T307a', 'T307b', 'T308a', 'T308b']);
const inCode = (id: string) => (DONE.has(domain(id).step) ? Object.values(domain(id).names) : keys(id));

function seedManifests(): Array<Record<string, unknown>> {
  return fs.readdirSync(path.join(ROOT, 'universe/modules')).map((m) => json(`universe/modules/${m}/manifest.json`));
}

describe('la tabella della lingua interna', () => {
  it('ogni dominio ha un id suo, un titolo, dove si legge e almeno una voce', () => {
    const ids = INTERNAL_NAMES.map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const x of INTERNAL_NAMES) {
      expect(x.title, x.id).toBeTruthy();
      expect(x.where.length, x.id).toBeGreaterThan(0);
      expect(x.reach.length, x.id).toBeGreaterThan(0);
      expect(Object.keys(x.names).length, x.id).toBeGreaterThan(0);
    }
  });

  it('i nomi interni hanno la forma del loro genere', () => {
    const bad: string[] = [];
    for (const x of INTERNAL_NAMES)
      for (const [it, en] of Object.entries(x.names)) {
        const ok = x.kind === 'fields' ? /^[a-z][A-Za-z0-9_]*$/.test(en) : x.kind === 'paths' ? /^[a-z.][a-z0-9_.\-/:]*$/.test(en) : /^[a-z][a-z0-9_.:-]*$/.test(en);
        if (!ok || en !== en.trim()) bad.push(`${x.id}: ${it} → ${en}`);
      }
    expect(bad).toEqual([]);
  });

  it('nessun doppione: due valori italiani di un dominio non diventano lo stesso nome', () => {
    const doubles: string[] = [];
    for (const x of INTERNAL_NAMES.filter((d) => d.kind !== 'fields')) {
      const seen = new Map<string, string>();
      for (const [it, en] of Object.entries(x.names)) {
        if (seen.has(en)) doubles.push(`${x.id}: ${seen.get(en)} e ${it} → ${en}`);
        seen.set(en, it);
      }
    }
    expect(doubles).toEqual([]);
  });

  it('nessuna catena: un nome interno non è un altro valore italiano dello stesso dominio', () => {
    const chains: string[] = [];
    for (const x of INTERNAL_NAMES)
      for (const [it, en] of Object.entries(x.names)) if (it !== en && Object.hasOwn(x.names, en) && x.names[en] !== en) chains.push(`${x.id}: ${it} → ${en} → ${x.names[en]}`);
    expect(chains).toEqual([]);
  });

  it('nessuna collisione con i nomi inglesi già usati nello stesso spazio', () => {
    const hits: string[] = [];
    for (const x of INTERNAL_NAMES) for (const [it, en] of Object.entries(x.names)) if (it !== en && x.taken?.includes(en)) hits.push(`${x.id}: ${it} → ${en}`);
    // A component keeps its name on disk and in Lua: the new ones must not be one the kernel has already.
    const parts = ENTITY_PARTS.filter((p) => !keys('componenti').includes(p) && !Object.values(domain('componenti').names).includes(p));
    for (const en of Object.values(domain('componenti').names)) if (parts.includes(en as never)) hits.push(`componenti: ${en}`);
    // The generic model of a class has the class's id: a class must not take the id of another model of the seed (once renamed, the
    // model of the class is the only one with that id: the Italian one is gone).
    const models = Object.keys(json('universe/models/index.json').models ?? json('universe/models/index.json'));
    for (const [it, en] of Object.entries(domain('classi').names)) if (models.includes(en) && en !== it && models.includes(it)) hits.push(`classi: ${en} è già un modello`);
    // A terrain's id and a layout's id must not be the name of another one of the seed.
    const tiles = Object.values(json('universe/modules/world.terrain/manifest.json').tiles as Record<string, { name: string }>).map((t) => t.name);
    for (const [it, en] of Object.entries(domain('terreni').names)) if (tiles.includes(en) && en !== it) hits.push(`terreni: ${en} è già un terreno`);
    const layouts = Object.keys(json('universe/modules/world.layouts/manifest.json').layouts);
    for (const [it, en] of Object.entries(domain('ambienti').names)) if (layouts.includes(en) && en !== it && layouts.includes(it)) hits.push(`ambienti: ${en} è già un ambiente`);
    expect(hits).toEqual([]);
  });

  it('nessun campo rinominato si scontra con un campo inglese accanto, nei file del seme e dei quattro universi', () => {
    const roots = ['universe', ...['aurora', 'neapolis', 'orichalcum', 'sidera'].map((u) => `lab/banco/universi-cloud/${u}`)];
    const fieldDomains = INTERNAL_NAMES.filter((x) => x.kind === 'fields');
    const hits = new Set<string>();
    const visit = (v: unknown, file: string) => {
      if (Array.isArray(v)) return v.forEach((x) => visit(x, file));
      if (!v || typeof v !== 'object') return;
      const own = Object.keys(v);
      for (const x of fieldDomains) for (const k of own) if (Object.hasOwn(x.names, k) && x.names[k] !== k && own.includes(x.names[k])) hits.add(`${file}: ${k} e ${x.names[k]} (${x.id})`);
      for (const c of Object.values(v)) visit(c, file);
    };
    const walk = (dir: string) => {
      if (!fs.existsSync(path.join(ROOT, dir))) return;
      for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
        const rel = `${dir}/${e.name}`;
        if (e.isDirectory()) walk(rel);
        else if (e.name.endsWith('.json')) visit(json(rel), rel);
      }
    };
    for (const r of roots) walk(r);
    expect([...hits]).toEqual([]);
  });

  it('copre i valori che il codice confronta', () => {
    const cover = (d: string, list: readonly string[]) => expect(list.filter((v) => !inCode(d).includes(v)), d).toEqual([]);
    cover('classi', CLASSES.map((c) => c.id));
    cover('taglie', SIZE_TIERS.map((s) => s.id));
    cover('effetti', EFFECT_TYPES);
    cover('categorie', ITEM_CATEGORIES);
    cover('impronte', ['shape', ...ITEM_SHAPES]);
    cover('timbri', STAMP_SHAPES);
    cover('momenti', DAY_PHASES);
    cover('dove', WHERES);
    cover('attivita', ACTIVITIES);
    cover('comportamenti', JOB_BEHAVIOURS);
    cover('imprese', VENTURE_TYPES);
    cover('classi-scultore', SCULPTOR_CLASSES);
    cover('coefficienti', COEFFICIENT_KEYS);
    cover('parti', [...PARTS, ...VIEWS]);
    // The components a client gets and the API of the ventures speak the contract 0.5 (T308b): nothing Italian is left.
    expect(ENTITY_PARTS.filter((p) => keys('componenti').includes(p))).toEqual([]);
    cover('componenti', ENTITY_PARTS.filter((p) => Object.values(domain('componenti').names).includes(p)));
    cover('api-lua', LUA_API.world.filter((f) => f.startsWith('venture')).map((f) => `world.${f}`));
    expect(LUA_API.world.filter((f) => f.startsWith('impresa'))).toEqual([]);
    cover('agenti', fs.readdirSync(path.join(ROOT, 'universe/prompts/agents')).map((f) => f.replace(/\.md$/, '')));
  });

  it('copre il seme: terreni, ambienti, azioni, rune, elementi, mestieri', () => {
    const terrain = json('universe/modules/world.terrain/manifest.json').tiles as Record<string, { name: string }>;
    expect(Object.values(terrain).map((t) => t.name).filter((n) => !keys('terreni').includes(n))).toEqual([]);
    expect(Object.keys(json('universe/modules/world.layouts/manifest.json').layouts).filter((n) => !inCode('ambienti').includes(n))).toEqual([]);
    // A terrain of the seed has the internal id of its name (T307a).
    expect(Object.values(terrain).filter((t) => internalName('terreni', t.name) !== (t as { id?: string }).id).map((t) => t.name)).toEqual([]);
    const actions = new Set<string>();
    const jobs = new Set<string>();
    const walk = (v: unknown, key?: string): void => {
      if (Array.isArray(v)) {
        for (const x of v) {
          if (key === 'actions' && x && typeof x === 'object' && typeof (x as { id?: unknown }).id === 'string') actions.add((x as { id: string }).id);
          if (key === 'mestieri' && x && typeof x === 'object' && typeof (x as { id?: unknown }).id === 'string') jobs.add((x as { id: string }).id);
          walk(x);
        }
      } else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, k);
    };
    for (const m of seedManifests()) walk(m);
    for (const f of fs.readdirSync(path.join(ROOT, 'universe/models')).filter((f) => f.endsWith('.xml')))
      for (const m of read(`universe/models/${f}`).matchAll(/<action\b[^>]*\bname="([^"]+)"/g)) actions.add(m[1]);
    expect([...actions].filter((a) => !inCode('azioni-seme').includes(a))).toEqual([]);
    expect([...jobs].filter((a) => !inCode('mestieri').includes(a))).toEqual([]);
    const magic = json('universe/modules/magic.runes/manifest.json') as { runes: Record<string, { element: string }>; spells: Record<string, unknown> };
    expect(Object.keys(magic.runes).filter((r) => !inCode('rune').includes(r))).toEqual([]);
    expect(Object.values(magic.runes).map((r) => r.element).filter((e) => !inCode('elementi').includes(e))).toEqual([]);
    // Every formula of the seed is made of rune tokens.
    for (const f of Object.keys(magic.spells)) for (const t of f.split(/\s+/)) expect(inCode('rune'), f).toContain(t);
    const modules = fs.readdirSync(path.join(ROOT, 'universe/modules')).filter((m) => /^(sys\.work|job\.|obj\.|item\.)/.test(m));
    expect(modules.filter((m) => !inCode('moduli-seme').includes(m))).toEqual([]);
    // The seed's sound programs and the gerboas of the teams have their internal ids (T307b).
    const models = fs.readdirSync(path.join(ROOT, 'universe/models')).map((f) => f.replace(/\.xml$/, ''));
    expect(models.filter((m) => /^suono-/.test(m) || (/^corona-gerboa-/.test(m) && keys('agenti').includes(m.slice('corona-gerboa-'.length))))).toEqual([]);
    expect(Object.values(domain('suoni-seme').names).filter((m) => !models.includes(m))).toEqual([]);
  });

  it('copre i messaggi del protocollo e i campi di stato del kernel', () => {
    const protocol = read('src/session/protocol.ts');
    const messages = [...new Set([...protocol.matchAll(/\bt: '([a-z_]+)'/g)].map((m) => m[1]))];
    expect(messages.filter((m) => !inCode('messaggi').includes(m))).toEqual([]);
    const kernel = read('src/kernel/kernel.ts');
    const fieldsOf = (name: string): string[] => [...(new RegExp(`const ${name}: ReadonlySet<string> = new Set\(\[([^\]]*)\]`).exec(kernel)?.[1] ?? '').matchAll(/'([^']+)'/g)].map((m) => m[1]);
    const english = new Set(['pos', 'inventory', 'needs', 'hand', 'slots']);
    // The kernel names the fields of 0.4 (T308a); the Italian ones of before it knows from the table, never to keep them.
    expect(fieldsOf('STATE_FIELDS').filter((f) => !inCode('campi-stato').includes(f))).toEqual([]);
    expect(fieldsOf('WANDERER_FIELDS').filter((f) => !english.has(f) && !inCode('campi-viandante').includes(f))).toEqual([]);
    const stateLine = kernel.split(/\r?\n/).find((l) => l.startsWith('const STATE_FIELDS')) ?? '';
    expect(inCode('campi-stato').filter((f) => !stateLine.includes(`'${f}'`))).toEqual([]);
    expect(kernel).toContain("...italianFieldsOf('campi-stato')");
    expect(kernel).toContain("...italianFieldsOf('campi-viandante')");
  });

  it('i percorsi del contratto 0.4 esistono nel codice, quelli di prima solo dove si leggono ancora (T308a)', () => {
    const code = ['src/kernel/paths.ts', 'src/kernel/kernel.ts', 'src/kernel/wanderers.ts', 'src/kernel/npc/ventures.ts', 'src/kernel/store.ts', 'src/kernel/ai/usage.ts', 'src/kernel/shortfalls.ts', 'src/kernel/cards.ts', 'src/kernel/graph.ts', 'src/kernel/universes.ts', 'server/universeStore.ts', 'server/ledger.ts', 'server/subscriptionQueue.ts', 'server/generation.ts', 'server/geminiProxy.ts', 'server/production.ts', 'server/folders.ts', 'src/kernel/agents/council.ts', 'src/kernel/magic.ts']
      .filter((f) => fs.existsSync(path.join(ROOT, f)))
      .map(read)
      .join('\n');
    const missing = inCode('percorsi').filter((p) => !code.includes(p.replace(/^universes\//, '').replace(/\/$/, '')));
    expect(missing).toEqual([]);
    // The server's folders of before are named only where they are moved from (server/folders.ts), and the line of the browser where it is read.
    const before = (f: string) => read(f);
    for (const p of keys('percorsi').filter((x) => x.startsWith('universes/')).map((x) => x.replace(/^universes\//, '').replace(/\/$/, '')))
      expect(before('server/folders.ts'), p).toContain(`'${p}'`);
    expect(before('src/kernel/universes.ts')).toContain("'quine:fila:'");
  });

  it('le rune magiche diventano latine, uguali in ogni lingua', () => {
    const runes = domain('rune');
    expect(runes.lang).toBe('la');
    expect(internalName('rune', 'fuoco')).toBe('ignis');
    expect(internalName('rune', 'x')).toBe('x');
    expect(internalName('rune', 'constructor')).toBe('constructor');
    expect(internalName('nessuno', 'fuoco')).toBe('fuoco');
  });

  it('docs/lingua-interna.md dice ogni voce', () => {
    const doc = read('docs/lingua-interna.md');
    const missing: string[] = [];
    for (const x of INTERNAL_NAMES) {
      if (!doc.includes(`(\`${x.id}\`)`)) missing.push(`dominio ${x.id}`);
      for (const [it, en] of Object.entries(x.names)) if (!doc.includes(`| \`${it}\` | \`${en}\` |`)) missing.push(`${x.id}: ${it} → ${en}`);
    }
    expect(missing).toEqual([]);
  });
});
