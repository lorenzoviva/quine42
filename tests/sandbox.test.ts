import { describe, expect, it } from 'vitest';
import { Sandbox } from '../src/kernel/sandbox';
import { fakeHost } from './helpers';

describe('sandbox', async () => {
  const { host, player, carpet, faults, logs } = fakeHost();
  const sb = await Sandbox.create(host);

  it('loads a module and runs its systems against kernel state', () => {
    expect(sb.loadModule('t', 'local M = {} function M.update(dt) carpet.ox = carpet.ox + dt end return M')).toBeNull();
    sb.run('t', 'update', 0.5);
    expect(carpet.ox).toBe(0.5);
  });

  it('reports syntax errors without running anything', () => {
    expect(sb.check('x = = 1')).toMatch(/unexpected symbol/);
    expect(sb.check('return x')).toBeNull();
  });

  it('isolates runtime errors as faults', () => {
    sb.loadModule('bad', 'local M = {} function M.update() local a = nil; return a.b end return M');
    sb.run('bad', 'update', 0);
    expect(faults['module:bad:update']).toMatch(/attempt to index/);
  });

  it('stops infinite loops with the instruction budget', () => {
    sb.loadModule('loop', 'local M = {} function M.update() while true do pcall(function() end) end end return M');
    sb.run('loop', 'update', 0);
    expect(faults['module:loop:update']).toMatch(/budget/);
  });

  it('hides the dangerous standard library', () => {
    sb.loadModule('peek', 'return { a = tostring(os), b = tostring(debug), c = tostring(load), d = tostring(_G) }');
    sb.loadModule('peek2', 'local M = {} function M.get() return tostring(os) .. tostring(debug) .. tostring(load) .. tostring(_G) end return M');
    expect(sb.run('peek2', 'get')).toBe('nilnilnilnil');
  });

  it('classifies rune lines', () => {
    expect(sb.runeKind('x')).toEqual({ kind: 'expr' });
    expect(sb.runeKind('carpet . strength = 0')).toEqual({ kind: 'stmt' });
    expect(sb.runeKind('carpet . strength =')).toHaveProperty('error');
  });

  it('runs rune lines bound to real symbols', () => {
    expect(sb.setLine('a', 'carpet . strength = 0')).toBeNull();
    expect(sb.runLine('a')).toBe('✓');
    expect(carpet.strength).toBe(0);
    sb.setLine('b', 'x');
    player.x = 2.5;
    expect(sb.runLine('b')).toBe('2.500');
    expect(sb.eval('carpet.rate')).toBe('6');
    expect(sb.eval('carpet')).toBe('carpet{...}');
  });

  it('validates writes to bound player symbols', () => {
    sb.setLine('c', 'x = "ciao"');
    expect(sb.runLine('c')).toBeNull();
    expect(faults['rune:c']).toMatch(/numero/);
  });

  it('lets runes sever a binding, breaking whoever depends on it', () => {
    sb.loadModule('tread', 'local M = {} function M.update() return carpet.rate end return M');
    sb.setLine('d', 'carpet = nil');
    sb.runLine('d');
    sb.run('tread', 'update');
    expect(faults['module:tread:update']).toMatch(/carpet/);
    sb.reset();
    sb.loadModule('tread', 'local M = {} function M.update() return carpet.rate end return M');
    expect(sb.run('tread', 'update')).toBe(6);
  });

  it('routes print to the kernel log', () => {
    sb.setLine('e', 'print ( time )');
    sb.runLine('e');
    expect(logs.at(-1)).toBe('1.500');
  });
});
