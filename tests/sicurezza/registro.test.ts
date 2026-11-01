import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// The conventions of docs/sicurezza/README.md: the register's form, and how the suite refers to it.

const REGISTER = readFileSync('docs/sicurezza/registro.md', 'utf8').replace(/\r\n/g, '\n');
const STATES = ['rilevata', 'specificata', 'in correzione', 'chiusa', 'accettata'];
const FIELDS = ['Gravità', 'Stato', 'Superficie', 'Proprietà violata', 'Prova', 'Contromisura', 'Task', 'Test'];

interface Entry {
  id: string;
  fields: Record<string, string>;
}

/** The entries under «Le voci»: the template at the top is in a code block and has no number. */
function entries(): Entry[] {
  return REGISTER.split(/^### /m)
    .slice(1)
    .filter((block) => /^V-\d{3} · /.test(block))
    .map((block) => {
      const fields: Record<string, string> = {};
      for (const m of block.matchAll(/^- ([^:\n]+): (.*)$/gm)) fields[m[1]] = m[2];
      return { id: block.slice(0, 5), fields };
    });
}

interface SuiteTest {
  file: string;
  kind: string;
  title: string;
}

function suiteTests(): SuiteTest[] {
  const out: SuiteTest[] = [];
  for (const file of readdirSync('tests/sicurezza')) {
    if (!file.endsWith('.test.ts') || file === 'registro.test.ts') continue;
    const source = readFileSync(`tests/sicurezza/${file}`, 'utf8');
    for (const m of source.matchAll(/^\s*it(\.fails|\.todo|\.skip|\.only)?\(\s*(['"`])(.*)$/gm)) {
      out.push({ file, kind: m[1] ?? '', title: m[3] });
    }
  }
  return out;
}

const stateOf = (e: Entry) => e.fields['Stato']?.replace(/`/g, '') ?? '';

describe('il registro delle vulnerabilità', () => {
  const list = entries();

  it('ha le voci, con numeri in ordine e senza buchi', () => {
    expect(list.length).toBeGreaterThanOrEqual(19);
    list.forEach((e, i) => expect(e.id).toBe(`V-${String(i + 1).padStart(3, '0')}`));
  });

  it('ogni voce ha tutti i campi e uno stato ammesso', () => {
    for (const e of list) {
      for (const field of FIELDS) expect(e.fields[field], `${e.id}: ${field}`).toBeTruthy();
      expect(STATES, e.id).toContain(stateOf(e));
    }
  });

  it('chi è specificata o in correzione ha un task', () => {
    for (const e of list) {
      if (stateOf(e) === 'specificata' || stateOf(e) === 'in correzione') expect(e.fields['Task'], e.id).toMatch(/T\d+/);
    }
  });

  it('chi è accettata dice perché', () => {
    for (const e of list) if (stateOf(e) === 'accettata') expect(e.fields['Esito'], e.id).toBeTruthy();
  });

  it('chi è chiusa ha un test che esiste e la nomina, e nessun .fails', () => {
    const tests = suiteTests();
    for (const e of list) {
      if (stateOf(e) !== 'chiusa') continue;
      const file = /`(tests\/sicurezza\/[^`]+)`/.exec(e.fields['Test'])?.[1];
      expect(file, e.id).toBeTruthy();
      expect(existsSync(file!), e.id).toBe(true);
      expect(e.fields['Esito'], e.id).toBeTruthy();
      const mine = tests.filter((t) => t.title.startsWith(e.id));
      expect(mine.some((t) => t.kind === ''), e.id).toBe(true);
      expect(mine.filter((t) => t.kind === '.fails'), e.id).toEqual([]);
    }
  });

  it('non contiene valori che sembrano segreti', () => {
    expect(REGISTER).not.toMatch(/AIza[\w-]{10,}|\b[sr]k_(live|test)_\w+|whsec_\w+|-----BEGIN/);
  });
});

describe('la suite di sicurezza', () => {
  const tests = suiteTests();
  const ids = new Set(entries().map((e) => e.id));
  const state = new Map(entries().map((e) => [e.id, stateOf(e)]));

  it('ogni test comincia con una voce del registro', () => {
    expect(tests.length).toBeGreaterThan(0);
    for (const t of tests) {
      const id = /^V-\d{3} /.exec(t.title)?.[0].trim();
      expect(id, `${t.file}: ${t.title}`).toBeTruthy();
      expect(ids.has(id!), `${t.file}: ${t.title}`).toBe(true);
    }
  });

  it('un it.fails sta solo su una voce aperta, e niente .skip né .only', () => {
    for (const t of tests) {
      expect(['.skip', '.only'], `${t.file}: ${t.title}`).not.toContain(t.kind);
      if (t.kind === '.fails') expect(['chiusa', 'accettata'], t.title).not.toContain(state.get(t.title.slice(0, 5)));
    }
  });

  it('una voce che porta un test nella suite lo dice nel campo Test', () => {
    for (const t of tests) {
      const entry = entries().find((e) => e.id === t.title.slice(0, 5));
      expect(entry?.fields['Test'], t.title).toContain(`tests/sicurezza/${t.file}`);
    }
  });
});
