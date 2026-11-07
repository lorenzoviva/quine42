// The comments of the seed are English (T309, ADR-0153): the Lua of universe/modules, the programs of universe/models and the official
// programs of lab/mjx/official. A comment may quote what the world says («…», "…"), in the language of its universe. The tool that
// translated them (`tools/lingua/cli.ts`) checks that the code around a comment does not move: the same Lua tokens, the same XML tree.

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { codeDifference, commentUnits, isItalian, luaScan } from '../tools/lingua/commenti';

const ROOT = path.resolve(__dirname, '..');
const SEED = ['universe/modules', 'universe/models', 'src/kernel/prelude.lua', 'lab/mjx/official'];

function files(rel: string, out: string[] = []): string[] {
  const abs = path.join(ROOT, rel);
  if (fs.statSync(abs).isFile()) return /\.(lua|xml)$/.test(rel) ? [...out, rel] : out;
  for (const e of fs.readdirSync(abs)) files(`${rel}/${e}`, out);
  return out;
}

describe('the comments of the seed', () => {
  it('are English', () => {
    const italian: string[] = [];
    for (const f of SEED.flatMap((r) => files(r))) {
      const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
      for (const u of commentUnits(src, f.endsWith('.lua') ? 'lua' : 'xml')) {
        const text = src.slice(u.start, u.end);
        if (isItalian(text)) italian.push(`${f}: ${text.slice(0, 80)}`);
      }
    }
    expect(italian).toEqual([]);
  });

  it('the heuristic tells Italian from English, and a quote is the world speaking', () => {
    expect(isItalian('-- Il passo del viandante: il terreno lo rallenta.')).toBe(true);
    expect(isItalian('<!-- Le foglie attorno ai rametti, poi la chioma -->')).toBe(true);
    expect(isItalian('-- The wanderer\'s step: the terrain slows it down.')).toBe(false);
    expect(isItalian('<!-- THE NEON SIGN "LA TORRE DELLA MAGIA" (y = 74) -->')).toBe(false);
    expect(isItalian('<!-- Space x=51..52 between DEL and MONDO -->')).toBe(false);
  });
});

describe('the identity of the code around the comments', () => {
  it('Lua: comments and spacing are not code, a token is', () => {
    const before = 'local x = 1 -- uno\n-- due\n--[[ tre ]] return x .. "--non è un commento"\n';
    expect(luaScan(before).comments.map((c) => before.slice(c.start, c.end))).toEqual(['-- uno', '-- due', '--[[ tre ]]']);
    expect(codeDifference(before, 'local x = 1 -- one\n-- two, and more\n--[[ three ]]   return x .. "--non è un commento"\n', 'lua')).toBeUndefined();
    expect(codeDifference(before, 'local x = 2 -- uno\n-- due\n--[[ tre ]] return x .. "--non è un commento"\n', 'lua')).toContain('"1"');
    expect(codeDifference(before, 'local x = 1 -- uno\n-- due\n--[[ tre ]] return x .. "--not a comment"\n', 'lua')).toBeDefined();
  });

  it('Lua: comment lines that follow each other are one unit, a comment after code is its own', () => {
    const src = '-- a\n-- b\nlocal x = 1 -- c\n\n-- d\n';
    expect(commentUnits(src, 'lua').map((u) => src.slice(u.start, u.end))).toEqual(['-- a\n-- b', '-- c', '-- d']);
  });

  it('XML: the tree without comments, attributes included', () => {
    const before = '<!-- la casa -->\n<sequence values="BA"><!-- il seme --><one in="B" out="A"/></sequence>';
    expect(codeDifference(before, '<!-- the house,\n on two lines -->\n<sequence values="BA"><!-- the seed --><one in="B" out="A"/></sequence>', 'xml')).toBeUndefined();
    expect(codeDifference(before, '<sequence values="BA"><one in="B" out="B"/></sequence>', 'xml')).toBeDefined();
  });
});
