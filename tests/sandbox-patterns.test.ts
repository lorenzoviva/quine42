import { LuaFactory } from 'wasmoon';
import { describe, expect, it } from 'vitest';
import { Sandbox } from '../src/kernel/sandbox';
import { fakeHost } from './helpers';

// The pattern matcher of prelude.lua, which replaces C's when a pattern could cost too much (ADR-0105), must be the same
// matcher: every call here runs in plain Lua 5.4 and in the Lua port, results and errors compared.

const SUBJECTS = ['', 'a', 'hello world', '  trim me  ', 'key = value', 'THE (quick) [brown] fox', 'a,b,,c,', 'aaab', 'x=1, y=22, z=333', '%d+', 'à è ì', 'THE (quick (nested)) end', 'one\ntwo\n'];
const PATTERNS = [
  'a', '.', '.-', '.*', '.+', 'a?', 'a*b', 'a-b', 'a+b', '^a', '^', '$', 'a$', '^$', '^%s*(.-)%s*$', '(%w+)%s*=%s*(%w+)', '%a+', '%d+', '%s', '%S+', '%u+', '%l+', '%p', '%w', '%x+', '%c', '%g+',
  '[abc]', '[^abc]', '[a-c]+', '[%a_][%w_]*', '[]]', '[^]]', '[a-]', '[%]]', '[%d,]+', '()', '()a()', '(a)(b)?', '((a)(a))', '(.)%1', '(a*)%1', '%b()', '%b[]', '%f[%w]%w+', '%f[%W]', 'o w', '%.', '%%', '%d', 'a%', '[a', '%b', '%f', '%fa', '(a', 'a)', '%1', '(a)%2', '(()', '%z',
  ',', ',*', '([^,]*),?', '(%d)(%d?)', 'x=(%d+), y=(%d+)', '\n', '[\n]', 'à', '^(.-)\n', '%(', '%)', '(%()', '.-.-.-',
];
const REPLS = ['"%0%0"', '"<%1>"', '"%%"', '"%"', '"%2"', '"x"', '""', '{a = "A", e = false, l = 7, h = {}}', 'function(...) return select("#", ...) end', 'function(a) return a == "a" and "Z" or nil end', 'function() return {} end', '12'];

const luaString = (s: string) => JSON.stringify(s);

/** Calls every case of a subject and a pattern and writes what came out, as text: the same code on both sides. */
const ONE = String.raw`
local function show(ok, ...)
  local out = { tostring(ok) }
  for i = 1, select("#", ...) do
    local v = select(i, ...)
    out[#out + 1] = math.type(v) == "integer" and "#" .. v or tostring(v)
  end
  return table.concat(out, "|")
end
local function iter(s, p, init)
  local ok, f = pcall(string.gmatch, s, p, init)
  if not ok then return "false|" .. tostring(f) end
  local out = {}
  for _ = 1, 40 do
    local r = { pcall(f) }
    if not r[1] then out[#out + 1] = "err " .. tostring(r[2]) break end
    if r[2] == nil then break end
    for i = 2, #r do out[#out + 1] = math.type(r[i]) == "integer" and "#" .. r[i] or tostring(r[i]) end
    out[#out + 1] = ";"
  end
  return table.concat(out, "|")
end
local subjects = { ${SUBJECTS.map(luaString).join(', ')} }
local patterns = { ${PATTERNS.map(luaString).join(', ')} }
local repls = { ${REPLS.join(', ')} }
local function one(i, j)
  local s, p = subjects[i], patterns[j]
  local head = string.format("%q %q ", s, p)
  local lines = {}
  for _, init in ipairs({ 1, 2, -2, 0, 100 }) do
    lines[#lines + 1] = head .. "find " .. init .. " " .. show(pcall(string.find, s, p, init))
    lines[#lines + 1] = head .. "match " .. init .. " " .. show(pcall(string.match, s, p, init))
    lines[#lines + 1] = head .. "gmatch " .. init .. " " .. iter(s, p, init)
  end
  for r, repl in ipairs(repls) do
    lines[#lines + 1] = head .. "gsub " .. r .. " " .. show(pcall(string.gsub, s, p, repl))
  end
  lines[#lines + 1] = head .. "gsub1 " .. show(pcall(string.gsub, s, p, "<%0>", 1))
  return table.concat(lines, "\n--\n")
end
`;

describe('il matcher dei pattern in Lua', () => {
  it('dà gli stessi risultati e gli stessi errori di quello in C', async () => {
    const engine = await new LuaFactory().createEngine();
    const expected = String(
      await engine.doString(`${ONE}
        local all = {}
        for i = 1, #subjects do for j = 1, #patterns do all[#all + 1] = one(i, j) end end
        return table.concat(all, "\\n--\\n")`),
    ).split('\n--\n');
    engine.global.close();

    const { host, faults } = fakeHost();
    const sb = await Sandbox.create(host);
    // Every pattern in the port.
    (sb as unknown as { K: { native_pattern(n: number): void } }).K.native_pattern(-1);
    expect(sb.loadModule('prova', `${ONE} local M = {} function M.update(i, j) return one(i, j) end return M`)).toBeNull();
    const got: string[] = [];
    for (let i = 1; i <= SUBJECTS.length; i++) for (let j = 1; j <= PATTERNS.length; j++) got.push(...String(sb.run('prova', 'update', i, j)).split('\n--\n'));
    expect(faults).toEqual({});
    expect(expected.length).toBeGreaterThan(1000);
    const different = got.map((line, i) => (line === expected[i] ? '' : `${line}  ≠  ${expected[i]}`)).filter(Boolean);
    expect(different.slice(0, 15)).toEqual([]);
    expect(got.length).toBe(expected.length);
  }, 120_000);

  it('anche quando il pattern è abbastanza piccolo per il C', async () => {
    const engine = await new LuaFactory().createEngine();
    const expected = String(await engine.doString(`${ONE} return one(3, 15) .. one(9, 16) .. one(7, 64)`));
    engine.global.close();
    const { host, faults } = fakeHost();
    const sb = await Sandbox.create(host);
    expect(sb.loadModule('prova', `${ONE} local M = {} function M.update() return one(3, 15) .. one(9, 16) .. one(7, 64) end return M`)).toBeNull();
    // An error of the C matcher says where it was called from: here, the prelude.
    expect(String(sb.run('prova', 'update', 0)).replace(/\[string "[^\n]*?"\]:\d+: /g, '')).toBe(expected);
    expect(faults).toEqual({});
  });
});
