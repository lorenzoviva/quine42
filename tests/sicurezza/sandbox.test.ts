import { describe, expect, it } from 'vitest';
import { Sandbox } from '../../src/kernel/sandbox';
import { modelErrors, Validator } from '../../src/kernel/validator';
import { runForm } from '../../src/kernel/forms';
import { MAX_FORM_TIME, MAX_FORM_XML } from '../../src/mj/run';
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
    const names = ['os', 'me', 'debug', 'load', 'require', 'package', 'getmetatable', 'setmetatable', 'rawset', 'coroutine', '_G', '__host'];
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

  it('V-007 un\'allocazione enorme finisce in un guasto', async () => {
    const { fault } = await runUpdate('return #string.rep("x", 200000000)');
    expect(fault).toBeTruthy();
  });

  // What stops the process if a limit is missing: each ends in a fault and quickly, without its payload in the report.
  // The time is wide because other tasks run on the machine: without the limits these take from minutes to forever.
  const QUICK = 5_000;
  const BLOCKS: [string, string][] = [
    ['un pattern patologico di string.find', `return string.find(string.rep('a', 3000), string.rep('.-', 24) .. 'x')`],
    ['lo stesso pattern con string.match', `return string.match(string.rep('a', 3000), string.rep('.-', 24) .. 'x')`],
    ['lo stesso pattern con string.gsub', `return string.gsub(string.rep('a', 3000), string.rep('.-', 24) .. 'x', '')`],
    ['lo stesso pattern con string.gmatch', `for _ in string.gmatch(string.rep('a', 3000), string.rep('.-', 24) .. 'x') do end`],
    ['lo stesso pattern con la sintassi a metodo', `local s = string.rep('a', 3000) return s:find(string.rep('.-', 24) .. 'x')`],
    ['un pattern lungo', `return string.find('a', string.rep('a?', 2000))`],
    ['string.rep di una stringa vuota', `return string.rep('', 1000000000000)`],
    ['string.rep con il conto scritto in lettere', `return string.rep('', '1000000000000')`],
    ['string.rep con un separatore', `return string.rep('x', 2000000, string.rep('y', 500))`],
    ['una stringa che raddoppia', `local s = 'x' while true do s = s .. s end`],
    ['copie di una stringa in un ciclo', `local s = string.rep('x', 1000000) while true do local t = s .. 'y' end`],
    ['una tabella senza fine', `local t, i = {}, 0 while true do i = i + 1 t[i] = i end`],
    ['stringhe tenute tutte', `local t, i = {}, 0 while true do i = i + 1 t[i] = string.rep('x', 900000) .. i end`],
    ['la memoria esaurita in un pcall in un ciclo', `local t, i = {}, 0 while true do i = i + 1 pcall(function() t[i] = string.rep('x', 900000) .. i end) end`],
    ['table.move senza fine', `return table.move({}, 1, 1000000000000, 2)`],
    ['table.unpack enorme', `return select('#', table.unpack({}, 1, 900000))`],
    ['unpack enorme', `return select('#', unpack({}, 1, 900000))`],
    ['string.byte in un ciclo', `local s = string.rep('x', 1000000) while true do string.byte(s, 1, -1) end`],
    ['table.concat in un ciclo', `local t = {} for i = 1, 100000 do t[i] = '' end while true do table.concat(t) end`],
    ['table.remove dalla testa in un ciclo', `local t = {} for i = 1, 200000 do t[i] = i end while true do table.insert(t, 1, table.remove(t, 1)) end`],
    ['stringhe lunghe confrontate in un ciclo', `local a, b = string.rep('x', 1000000), string.rep('x', 999999) .. 'x' while a == b do end`],
  ];
  for (const [name, body] of BLOCKS) {
    it(`V-007 ${name} finisce in un guasto, presto`, async () => {
      const t0 = performance.now();
      const { fault } = await runUpdate(body);
      expect(fault).toBeTruthy();
      expect(fault!.length).toBeLessThan(500);
      expect(performance.now() - t0).toBeLessThan(QUICK);
    }, 30_000);
  }

  it('V-007 un errore lanciato non porta il suo testo intero nel guasto', async () => {
    const { fault } = await runUpdate(`error(string.rep('segreto ', 100000))`);
    expect(fault!.length).toBeLessThan(500);
  });

  it('V-007 dopo un guasto di memoria la sandbox gira ancora', async () => {
    const { host, faults } = fakeHost();
    const sb = await Sandbox.create(host);
    expect(sb.loadModule('prova', `local M = {} function M.fill() local t = {} while true do t[#t + 1] = string.rep('x', 900000) .. #t end end function M.ok(a) return a + 1 end return M`)).toBeNull();
    sb.run('prova', 'fill', 0);
    expect(faults['module:prova:fill']).toMatch(/memoria|budget/);
    expect(sb.run('prova', 'ok', 41)).toBe(42);
  });

  it('V-007 ciò che resta tenuto non impedisce al kernel di parlare con la sandbox', async () => {
    const { host, faults } = fakeHost();
    const sb = await Sandbox.create(host);
    // A global left full by a module: the others fail with a fault, the kernel's own calls keep working.
    expect(sb.loadModule('pieno', `local M = {} function M.fill() keep = {} while true do keep[#keep + 1] = string.rep('x', 900000) .. #keep end end return M`)).toBeNull();
    expect(sb.loadModule('altro', `local M = {} function M.big() return string.rep('y', 500000) .. 'z' end return M`)).toBeNull();
    sb.run('pieno', 'fill', 0);
    expect(faults['module:pieno:fill']).toBeTruthy();
    sb.seed(7);
    sb.setLine('riga', '1 + 1');
    sb.run('altro', 'big', 'un argomento che il kernel spinge');
    expect(sb.has('altro', 'big')).toBe(true);
    sb.reset();
    expect(sb.loadModule('dopo', `local M = {} function M.ok() return #string.rep('y', 500000) end return M`)).toBeNull();
    expect(sb.run('dopo', 'ok', 0)).toBe(500000);
  });

  it('V-007 il budget del tick ferma chi viene dopo, senza un guasto suo; core.* gira comunque', async () => {
    const { host, faults } = fakeHost();
    const sb = await Sandbox.create(host);
    const busy = `local M = {} function M.update() local n = 0 for i = 1, 900000 do n = n + i end return n end return M`;
    for (let i = 0; i < 12; i++) expect(sb.loadModule(`mod.${i}`, busy)).toBeNull();
    expect(sb.loadModule('core.movement', `local M = {} function M.update() return 'mosso' end return M`)).toBeNull();
    sb.tickBegin();
    const ran = Array.from({ length: 12 }, (_, i) => sb.run(`mod.${i}`, 'update', 0));
    expect(sb.run('core.movement', 'update', 0)).toBe('mosso');
    const skipped = sb.tickEnd();
    expect(skipped).toBeGreaterThan(0);
    expect(ran.filter((r) => r === undefined || r === null).length).toBeGreaterThanOrEqual(skipped);
    // At most the one that crossed the budget has a fault.
    expect(Object.keys(faults).length).toBeLessThanOrEqual(1);
    // A new tick has its budget back, and out of a tick only the budget of each call counts.
    sb.tickBegin();
    expect(sb.run('mod.11', 'update', 0)).toBeTruthy();
    expect(sb.tickEnd()).toBe(0);
    for (let i = 0; i < 12; i++) expect(sb.run(`mod.${i}`, 'update', 0)).toBeTruthy();
  }, 30_000);

  it('V-007 le chiamate annidate attraverso l\'Host hanno i loro limiti e rimettono a posto quelli di fuori', async () => {
    const { host, faults } = fakeHost();
    let sb!: Sandbox;
    host.say = () => {
      sb.run('dentro', 'update', 0);
    };
    sb = await Sandbox.create(host);
    expect(sb.loadModule('dentro', `local M = {} function M.update() return #string.rep('y', 1000) end return M`)).toBeNull();
    expect(sb.loadModule('fuori', `local M = {} function M.update() world.say('x') while true do end end return M`)).toBeNull();
    sb.run('fuori', 'update', 0);
    expect(faults['module:fuori:update']).toMatch(/budget/);
    expect(faults['module:dentro:update']).toBeUndefined();
  });

  it('V-019 dai valori che l\'Host dà a Lua non si raggiungono costruttori né prototipi di JS', async () => {
    const { result } = await runUpdate(
      `local out = {} for _, key in ipairs({ 'constructor', '__proto__', 'toString', 'hasOwnProperty' }) do local ok, got = pcall(function() return carpet[key] end) if ok and got ~= nil then out[#out + 1] = key end end return table.concat(out, ' ')`,
    );
    expect(result).toBe('');
  });

  it('V-019 pcall non scavalca il budget di istruzioni', async () => {
    const { fault } = await runUpdate('while true do pcall(function() while true do end end) end');
    expect(fault).toMatch(/budget/);
  });

  it('V-017 dump non si raggiunge con la sintassi a metodo sulle stringhe', async () => {
    const { result } = await runUpdate(`local ok, f = pcall(function() return ('x').dump end) return ok and type(f) or 'nil'`);
    expect(result).toBe('nil');
  });

  it('V-008 una funzione Lua in una tabella passata all\'Host non arriva a JS come funzione', async () => {
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

  it('V-008 la prova di caricamento non lascia nulla nella sandbox viva', async () => {
    const { host } = fakeHost();
    const sb = await Sandbox.create(host);
    const errors = new Validator(sb).validateForged({ id: 'item.sonda', name: 'Sonda', kind: 'entity', appearance: { glyph: 's', color: '#fff' } } as never, `math.sonda_v008 = 'rimasto' return {}`, new Set());
    expect(errors).toEqual([]);
    expect(sb.loadModule('dopo', `local M = {} function M.update() return tostring(math.sonda_v008) end return M`)).toBeNull();
    expect(sb.run('dopo', 'update', 0)).toBe('nil');
  });

  it('V-007 i programmi MarkovJunior che dicono una scatola enorme non partono', () => {
    const size = '512 512 512';
    const errors = modelErrors('models/enorme.xml', `<one values="BW" size="${size}" in="B" out="W"/>`);
    expect(errors.join()).toMatch(/griglia troppo grande|size/);
    expect(() => runForm({ xml: `<one values="BW" size="${size}" in="B" out="W"/>`, seed: 1 } as never)).toThrow(/griglia troppo grande|size/);
  });

  it('V-007 un programma MarkovJunior non può chiedere più tempo del massimo', () => {
    // A rule that never ends: rewriting in circles, in a box the limits allow.
    const xml = `<markov values="BW" size="64 64 1" origin="True"><one in="W" out="B"/><one in="B" out="W"/></markov>`;
    const t0 = performance.now();
    const errors = modelErrors('models/lento.xml', xml, 200);
    expect(errors.join()).toMatch(/non finisce/);
    expect(performance.now() - t0).toBeLessThan(5_000);
    expect(MAX_FORM_TIME).toBeLessThanOrEqual(30_000);
    expect(modelErrors('models/lungo.xml', ' '.repeat(MAX_FORM_XML + 1)).join()).toMatch(/troppo lungo/);
  });
});
