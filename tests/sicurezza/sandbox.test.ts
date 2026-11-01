import { describe, expect, it } from 'vitest';
import { Sandbox } from '../../src/kernel/sandbox';
import { Validator } from '../../src/kernel/validator';
import { fakeHost } from '../helpers';

// See docs/sicurezza/README.md: each test starts with its V-NNN and states the property;
// `it.fails` marks an open vulnerability and goes red when the hole closes: whoever closes it removes `.fails`.

/** Runs `body` as a module's update in a fresh sandbox; returns its fault and its result. */
async function runUpdate(body: string) {
  const { host, faults } = fakeHost();
  const sb = await Sandbox.create(host);
  expect(sb.loadModule('prova', `local M = {} function M.update() ${body} end return M`)).toBeNull();
  const result = sb.run('prova', 'update', 0);
  return { fault: faults['module:prova:update'], result };
}

describe('la sandbox (ciò che T117 ha provato)', () => {
  it('V-019 i globali pericolosi non si vedono dall\'ambiente di un modulo', async () => {
    const names = ['os', 'io', 'debug', 'load', 'require', 'package', 'getmetatable', 'setmetatable', 'rawset', 'coroutine', '_G', '__host'];
    const { fault, result } = await runUpdate(
      `local seen = {} for _, n in ipairs({ ${names.map((n) => `'${n}'`).join(', ')} }) do if _ENV[n] ~= nil then seen[#seen + 1] = n end end return table.concat(seen, ' ')`,
    );
    expect(fault).toBeUndefined();
    expect(result).toBe('');
  });

  it('V-007 un ciclo infinito finisce in un guasto del budget', async () => {
    const { fault } = await runUpdate('while true do end');
    expect(fault).toMatch(/budget/);
  });

  // Open: T117 measured 1.8 s and 200 MB with no fault. T126 closes it (memory and length limits).
  it.fails('V-007 un\'allocazione enorme finisce in un guasto', async () => {
    const { fault } = await runUpdate('return #string.rep("x", 200000000)');
    expect(fault).toBeTruthy();
  });

  // Open: T122. The fields are looked at by their type: none gets called.
  it.fails('V-019 dai valori che l\'Host dà a Lua non si raggiungono costruttori né prototipi di JS', async () => {
    const { result } = await runUpdate(
      `local out = {} for _, key in ipairs({ 'constructor', '__proto__', 'toString', 'hasOwnProperty' }) do local ok, got = pcall(function() return carpet[key] end) if ok and got ~= nil then out[#out + 1] = key end end return table.concat(out, ' ')`,
    );
    expect(result).toBe('');
  });

  it('V-019 pcall non scavalca il budget di istruzioni', async () => {
    const { fault } = await runUpdate('while true do pcall(function() while true do end end) end');
    expect(fault).toMatch(/budget/);
  });

  it('V-019 un valore finto dell\'ambiente del processo non si trova in ciò che Lua vede', async () => {
    process.env.SONDA_V019 = 'SONDA-AMBIENTE-V019';
    try {
      const { result } = await runUpdate(
        `local seen, found = {}, 0 local function walk(v, d) if d > 8 then return end if type(v) == 'string' then if string.find(v, 'SONDA-AMBIENTE-V019', 1, true) then found = found + 1 end elseif type(v) == 'table' and not seen[v] then seen[v] = true for k, x in pairs(v) do walk(k, d + 1) walk(x, d + 1) end end end walk(_ENV, 0) return tostring(found)`,
      );
      expect(result).toBe('0');
    } finally {
      delete process.env.SONDA_V019;
    }
  });

  // Open: T122.
  it.fails('V-017 dump non si raggiunge con la sintassi a metodo sulle stringhe', async () => {
    const { result } = await runUpdate(`local ok, f = pcall(function() return ('x').dump end) return ok and type(f) or 'nil'`);
    expect(result).toBe('nil');
  });

  // Open: T122.
  it.fails('V-008 una funzione Lua in una tabella passata all\'Host non arriva a JS come funzione', async () => {
    const { host } = fakeHost();
    let seen = 'non arrivato';
    host.emit = (_name, data) => {
      seen = typeof (data as { f?: unknown })?.f;
    };
    const sb = await Sandbox.create(host);
    expect(sb.loadModule('prova', `local M = {} function M.update() bus.emit('sonda', { f = function() end }) end return M`)).toBeNull();
    sb.run('prova', 'update', 0);
    expect(seen).not.toBe('function');
  });

  // Open: T122.
  it.fails('V-008 la prova di caricamento non lascia nulla nella sandbox viva', async () => {
    const { host } = fakeHost();
    const sb = await Sandbox.create(host);
    const errors = new Validator(sb).validateForged({ id: 'item.sonda', name: 'Sonda', kind: 'entity', appearance: { glyph: 's', color: '#fff' } } as never, `math.sonda_v008 = 'rimasto' return {}`, new Set());
    expect(errors).toEqual([]);
    expect(sb.loadModule('dopo', `local M = {} function M.update() return tostring(math.sonda_v008) end return M`)).toBeNull();
    expect(sb.run('dopo', 'update', 0)).toBe('nil');
  });

  // Blocks the process in a C function, so vitest could not interrupt it: T126 writes it once it ends quickly,
  // until then it belongs to the author's kit (T137: V-007.a).
  it.todo('V-007 un pattern patologico di string.find finisce in un guasto');
});
