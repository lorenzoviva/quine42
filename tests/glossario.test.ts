// The glossary (T178, ADR-0117): every entry has its fields, and what it names exists.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '..');

interface Entry {
  name: string;
  fields: Record<string, string>;
  unknown: string[];
}
interface Tool {
  parseGlossary(text: string): Entry[];
  namesIn(text: string): string[];
  synonymsOf(text: string): string[];
  REQUIRED_FIELDS: string[];
  OPTIONAL_FIELDS: string[];
}

function codeOf(dir: string): string {
  let out = '';
  for (const item of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = `${dir}/${item.name}`;
    if (item.isDirectory()) out += codeOf(rel);
    else if (/\.(ts|lua)$/.test(item.name)) out += `${fs.readFileSync(path.join(ROOT, rel), 'utf8')}\n`;
  }
  return out;
}

describe('il glossario', () => {
  let tool: Tool;
  let entries: Entry[];
  let code: string;

  beforeAll(async () => {
    tool = (await import(/* @vite-ignore */ pathToFileURL(path.join(ROOT, 'tools/glossario/glossario.mjs')).href)) as Tool;
    entries = tool.parseGlossary(fs.readFileSync(path.join(ROOT, 'docs/glossario.md'), 'utf8'));
    // The SoundLab's retouches are a concept with a voice, and the page is where they live (T222); the players' labs live in lab/handmade (T294).
    code = codeOf('src') + codeOf('server') + codeOf('site') + codeOf('lab/suono') + codeOf('lab/handmade');
  });

  it('copre i concetti che confondevano', () => {
    const names = entries.map((e) => e.name);
    for (const concept of ['Struttura', 'Edificio', 'Luogo', 'Viandante', 'Giocatore', 'Modello', 'Programma', 'Forma', 'Entità', 'Master', 'God mode']) {
      expect(names).toContain(concept);
    }
    expect(new Set(names).size).toBe(names.length);
  });

  it('ogni voce ha i suoi campi, e nessun altro', () => {
    const known = [...tool.REQUIRED_FIELDS, ...tool.OPTIONAL_FIELDS];
    for (const e of entries) {
      for (const field of tool.REQUIRED_FIELDS) expect(e.fields[field], `${e.name}: ${field}`).toBeTruthy();
      expect(Object.keys(e.fields).filter((f) => !known.includes(f)), e.name).toEqual([]);
      expect(e.unknown, e.name).toEqual([]);
    }
  });

  it('i nomi in inglese esistono in src/, server/, site/, lab/suono/ o lab/handmade/', () => {
    const missing: string[] = [];
    for (const e of entries) {
      const names = tool.namesIn(e.fields.Inglese);
      if (!names.length) missing.push(`${e.name}: nessun nome`);
      for (const n of names) {
        const escaped = n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (!new RegExp(`(?<![\\w$])${escaped}(?![\\w$])`).test(code)) missing.push(`${e.name}: ${n}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('i file e le cartelle di «Dove vive» esistono', () => {
    const missing: string[] = [];
    for (const e of entries) {
      const paths = tool.namesIn(e.fields['Dove vive']).filter((p) => /^(src|server|universe|tools)\//.test(p) && !p.includes('<') && !p.includes('→'));
      for (const p of paths) if (!fs.existsSync(path.join(ROOT, p))) missing.push(`${e.name}: ${p}`);
    }
    expect(missing).toEqual([]);
  });

  it('i sinonimi sono i nomi fuori dalle parentesi', () => {
    expect(tool.synonymsOf('`player` (per il personaggio, non `wanderer`), `hero`')).toEqual(['player', 'hero']);
    expect(tool.synonymsOf('nessuno (`kernel.zone` è un omonimo)')).toEqual([]);
  });

  it('una voce riconosce un campo mancante', () => {
    const [entry] = tool.parseGlossary('### Prova\n- **Inglese**: `prova`\ntesto sparso\n');
    expect(entry.fields.Definizione).toBeUndefined();
    expect(entry.unknown).toEqual(['testo sparso']);
  });
});
