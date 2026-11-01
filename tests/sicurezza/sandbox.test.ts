import { describe, expect, it } from 'vitest';
import { Sandbox } from '../../src/kernel/sandbox';
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

  // Blocks the process in a C function, so vitest could not interrupt it: T126 writes it once it ends quickly,
  // until then it belongs to the author's kit (T137).
  it.todo('V-007 un pattern patologico di string.find finisce in un guasto');
});
