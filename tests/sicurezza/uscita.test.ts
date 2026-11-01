import { describe, expect, it } from 'vitest';
import { Sandbox, type Host } from '../../src/kernel/sandbox';
import { Validator } from '../../src/kernel/validator';
import { fakeHost } from '../helpers';

// The property that matters most (T122, docs/sicurezza/README.md): from Lua nothing of JS is reachable but data.
// Every test states it on one way through; what is reached is looked at by its type, nothing that is reached gets called.

const JS_NAMES = ['constructor', '__proto__', 'prototype', 'toString', 'valueOf', 'hasOwnProperty', '__lookupGetter__', '__defineGetter__', 'then', 'call', 'apply', 'bind', 'push', 'map'];
const JS_LIST = JS_NAMES.map((n) => `'${n}'`).join(', ');

class Thing {
  own = 1;
  method(): number {
    return 2;
  }
}

async function sandbox(change?: (host: Host) => void) {
  const fake = fakeHost();
  change?.(fake.host);
  const sb = await Sandbox.create(fake.host);
  const run = (body: string, ...args: unknown[]) => {
    const name = `prova${Math.random()}`;
    expect(sb.loadModule(name, `local M = {} function M.update(a, b) ${body} end return M`)).toBeNull();
    const result = sb.run(name, 'update', ...args);
    return { result, fault: fake.faults[`module:${name}:update`] };
  };
  return { ...fake, sb, run };
}

/** Lua that lists which of the names of JS a value answers to. */
const LOOK = `
  local function look(v)
    local out = {}
    for _, key in ipairs({ ${JS_LIST} }) do
      local ok, got = pcall(function() return v[key] end)
      if ok and got ~= nil then out[#out + 1] = key end
    end
    return table.concat(out, ' ')
  end
`;

describe("dai valori dell'Host non si esce", () => {
  it('V-019 oggetti, annidati, liste e istanze di classi danno solo i loro campi di dati', async () => {
    const component = { x: 1, inner: { y: 2 }, list: [1, { z: 3 }], thing: new Thing(), fn: () => 1 };
    const { run } = await sandbox((h) => {
      h.get = () => component;
    });
    const { result, fault } = run(`${LOOK}
      local c = ecs.get(1, 'c')
      return table.concat({ look(c), look(c.inner), look(c.list), look(c.list[2]), look(c.thing), look(carpet), look(world.player_pos()) }, '|')`);
    expect(fault).toBeUndefined();
    expect(result).toBe('||||||');
  });

  it("V-019 i campi di dati restano leggibili e scrivibili sull'oggetto vero", async () => {
    const component = { x: 1, list: [10, 20], thing: new Thing(), fn: () => 1 };
    const { run } = await sandbox((h) => {
      h.get = () => component;
    });
    const { result } = run(`local c = ecs.get(1, 'c')
      c.x = c.x + 1; c.nuovo = 'a'; c.list[3] = 30
      return table.concat({ c.x, c.list[2], #c.list, c.thing.own, tostring(c.fn), tostring(c.thing.method), tostring(c == ecs.get(1, 'c')) }, ' ')`);
    expect(result).toBe('2 20 3 1 nil nil true');
    expect(component.x).toBe(2);
    expect(component).toMatchObject({ nuovo: 'a', list: [10, 20, 30] });
  });

  it('V-019 pairs elenca solo i dati, e nessun valore si chiama', async () => {
    const { run } = await sandbox((h) => {
      h.get = () => ({ a: 1, fn: () => 1 });
    });
    const { result } = run(`local c = ecs.get(1, 'c')
      local keys = {} for k in pairs(c) do keys[#keys + 1] = k end
      local called = pcall(function() return c() end)
      return table.concat(keys, ' ') .. ' ' .. tostring(called)`);
    expect(result).toBe('a false');
  });

  it('V-019 anche ciò che il kernel passa alle funzioni dei moduli è solo dati', async () => {
    const { run } = await sandbox();
    const { result } = run(`${LOOK} return look(a) .. '|' .. a.campo`, { campo: 'v', fn: () => 1 });
    expect(result).toBe('|v');
  });

  it("V-019 un errore preso con pcall è testo, sia del kernel sia dell'indice sbagliato", async () => {
    const { run } = await sandbox((h) => {
      h.first = () => {
        throw new Error('errore del kernel');
      };
    });
    const { result } = run(`local ok, e = pcall(ecs.first, 'x')
      local ok2, e2 = pcall(function() return carpet[true] end)
      local ok3, e3 = pcall(function() carpet[{}] = 1 end)
      return table.concat({ tostring(ok), type(e), tostring(e), tostring(ok2), type(e2), tostring(ok3), type(e3) }, ' ')`);
    expect(result).toBe('false string errore del kernel true nil true nil');
  });

  it('V-019 process, require e simili non ci sono, né come globali né come campi', async () => {
    const { run } = await sandbox();
    const names = ['process', 'require', 'global', 'globalThis', 'module', 'Function', 'eval', 'Object', 'coroutine', 'collectgarbage', 'dofile', 'loadfile', 'rawget', 'rawequal', 'xpcall', 'K', 'host'];
    const { result } = run(`local out = {}
      for _, n in ipairs({ ${names.map((n) => `'${n}'`).join(', ')} }) do
        if _ENV[n] ~= nil or carpet[n] ~= nil then out[#out + 1] = n end
      end
      return table.concat(out, ' ')`);
    expect(result).toBe('');
  });

  it("V-019 le stringhe e le funzioni dell'API non portano ad altro", async () => {
    const { run } = await sandbox();
    const { result } = run(`${LOOK}
      local out = { look('x') }
      for _, name in ipairs({ 'ecs', 'world', 'inventory', 'input', 'bus', 'items', 'ui' }) do
        for k, f in pairs(_ENV[name]) do
          if type(f) ~= 'function' then out[#out + 1] = name .. '.' .. k end
          local ok, got = pcall(function() return f.constructor end)
          if ok and got ~= nil then out[#out + 1] = name .. '.' .. k end
        end
      end
      return table.concat(out, ' ')`);
    expect(result).toBe('');
  });

  it('V-019 scrivere i nomi del prototipo non tocca i prototipi di JS', async () => {
    const carpetOf = { strength: 1 };
    const { run } = await sandbox((h) => {
      h.carpet = () => carpetOf as never;
    });
    const { fault } = run(`carpet.__proto__ = { sonda = 1 }
      carpet.constructor = { prototype = { sonda = 1 } }
      carpet.toString = 'x'
      carpet.hasOwnProperty = 1`);
    expect(fault).toBeUndefined();
    expect(Object.getPrototypeOf(carpetOf)).toBe(Object.prototype);
    expect(Object.keys(carpetOf)).toEqual(['strength']);
    expect(({} as Record<string, unknown>).sonda).toBeUndefined();
  });

  it('V-019 una tabella con i nomi del prototipo arriva a JS senza di loro', async () => {
    let got: any;
    const { run } = await sandbox((h) => {
      h.emit = (_n, data) => {
        got = data;
      };
    });
    run(`bus.emit('x', { __proto__ = { sonda = 1 }, constructor = 1, toString = 1, valueOf = 1, hasOwnProperty = 1, buono = { __proto__ = { sonda = 2 }, si = 1 } })`);
    expect(Object.keys(got)).toEqual(['buono']);
    expect(Object.getPrototypeOf(got)).toBe(Object.prototype);
    expect(got.sonda).toBeUndefined();
    expect(got.buono).toEqual({ si: 1 });
    expect(got.buono.sonda).toBeUndefined();
    expect(({} as Record<string, unknown>).sonda).toBeUndefined();
  });

  it("V-019 un valore finto dell'ambiente non si trova nemmeno scorrendo i valori dell'Host", async () => {
    process.env.SONDA_V019 = 'SONDA-AMBIENTE-V019-BIS';
    try {
      const { run } = await sandbox((h) => {
        h.get = () => ({ a: { b: [1, 'c', { d: new Thing() }] } });
      });
      const { result } = run(`local seen, found, strings = {}, 0, 0
        local function walk(v, d)
          if d > 10 then return end
          local t = type(v)
          if t == 'string' then
            strings = strings + 1
            if string.find(v, 'SONDA-AMBIENTE', 1, true) then found = found + 1 end
          elseif (t == 'table' or t == 'userdata') and not seen[v] then
            seen[v] = true
            for k, x in pairs(v) do walk(k, d + 1) walk(x, d + 1) end
          end
        end
        -- The environment of a module is empty: what it sees comes from __index, so it goes by name.
        for _, name in ipairs({ 'math', 'string', 'table', 'utf8', 'ecs', 'input', 'world', 'bus', 'inventory', 'items', 'ui' }) do walk(_ENV[name], 0) end
        walk(carpet, 0) walk(ecs.get(1, 'c'), 0) walk(world.player_pos(), 0)
        return found .. ' ' .. tostring(strings > 50)`);
      expect(result).toBe('0 true');
    } finally {
      delete process.env.SONDA_V019;
    }
  });
});

describe('string.dump', () => {
  it("V-017 dump non c'è, né nella tabella né con la sintassi a metodo", async () => {
    const { run } = await sandbox();
    const { result } = run(`return type(string.dump) .. ' ' .. type(('x').dump)`);
    expect(result).toBe('nil nil');
  });

  it("V-017 dopo un reset dell'universo dump non torna", async () => {
    const { sb, run } = await sandbox();
    sb.reset();
    expect(run(`return type(string.dump) .. ' ' .. type(('x').dump)`).result).toBe('nil nil');
  });
});

describe('il budget di istruzioni', () => {
  const BODIES: Record<string, string> = {
    'pcall annidati': 'while true do pcall(function() while true do pcall(function() end) end end) end',
    'la ricorsione dentro pcall': 'local function f() pcall(f) while true do end end f()',
    'una callback di string.gsub': `string.gsub('aaa', 'a', function() while true do end end)`,
    'un comparatore di table.sort': 'local t = { 3, 2, 1 } table.sort(t, function() while true do end end)',
    "chi riprende l'errore del budget e continua": 'while true do local ok = pcall(function() while true do end end) if not ok then for i = 1, 10 do end end end',
    'pcall di assert e error': 'while true do pcall(assert, false, "x") pcall(error, "x") end',
  };
  for (const [name, body] of Object.entries(BODIES)) {
    it(`V-019 non lo scavalca ${name}`, async () => {
      const { run } = await sandbox();
      expect(run(body).fault).toMatch(/budget/);
    });
  }

  it('V-019 non lo scavalca una chiamata al kernel che rientra in Lua', async () => {
    let sb!: Sandbox;
    const { faults, host } = fakeHost();
    host.first = () => {
      sb.run('dentro', 'update', 0);
      return undefined;
    };
    sb = await Sandbox.create(host);
    expect(sb.loadModule('dentro', 'local M = {} function M.update() return 1 end return M')).toBeNull();
    expect(sb.loadModule('fuori', `local M = {} function M.update() ecs.first('x') while true do end end return M`)).toBeNull();
    sb.run('fuori', 'update', 0);
    expect(faults['module:fuori:update']).toMatch(/budget/);
  });

  it('V-019 il rientro nel kernel senza fine finisce, e la sandbox continua a lavorare', async () => {
    let sb!: Sandbox;
    let depth = 0;
    const { host } = fakeHost();
    host.first = () => {
      depth++;
      sb.run('giro', 'update', 0);
      return undefined;
    };
    sb = await Sandbox.create(host);
    expect(sb.loadModule('giro', `local M = {} function M.update() ecs.first('x') end return M`)).toBeNull();
    sb.run('giro', 'update', 0);
    expect(depth).toBeGreaterThan(0);
    expect(sb.loadModule('dopo', 'local M = {} function M.update() return 1 + 1 end return M')).toBeNull();
    expect(sb.run('dopo', 'update', 0)).toBe(2);
  });

  it('V-019 dopo un guasto del budget la sandbox continua a lavorare', async () => {
    const { run } = await sandbox();
    expect(run('while true do end').fault).toMatch(/budget/);
    expect(run('return 1 + 1').result).toBe(2);
  });

  it('V-019 il modulo che si carica sta nel budget', async () => {
    const { sb } = await sandbox();
    expect(sb.loadModule('ciclo', 'while true do end return {}')).toMatch(/budget/);
  });

  it("V-019 una riga di rune non vede l'Host", async () => {
    const { sb, faults } = await sandbox();
    expect(sb.setLine('r', `__host == nil and host == nil`)).toBeNull();
    expect(sb.runLine('r')).toBe('true');
    expect(faults['rune:r']).toBeUndefined();
  });
});

describe('le funzioni Lua non arrivano a JS', () => {
  it('V-008 né nelle tabelle date all\'Host, né come valori, né in ciò che un modulo restituisce', async () => {
    const seen: unknown[] = [];
    const component: Record<string, unknown> = {};
    const { run } = await sandbox((h) => {
      h.emit = (_n, data) => {
        seen.push(data);
      };
      h.spawn = (c) => {
        seen.push(c);
        return 1;
      };
      h.set = (_id, _name, data) => {
        seen.push(data);
        return true;
      };
      h.get = () => component;
    });
    const { result } = run(`local f = function() end
      bus.emit('a', { f = f, dentro = { f = f, lista = { f, 1 } } })
      bus.emit('b', f)
      ecs.spawn({ f = f })
      ecs.set(1, 'c', { toString = f, valueOf = f, ['then'] = f, toJSON = f })
      local c = ecs.get(1, 'c') c.f = f c.g = { f = f }
      return { f = f, dentro = { f = f } }`);
    const functions: string[] = [];
    const walk = (v: unknown, path: string, depth = 0): void => {
      if (typeof v === 'function') functions.push(path);
      else if (v && typeof v === 'object' && depth < 10) for (const k of Object.getOwnPropertyNames(v)) walk((v as any)[k], `${path}.${k}`, depth + 1);
    };
    walk(seen, 'dati');
    walk(component, 'componente');
    walk(result, 'risultato');
    expect(functions).toEqual([]);
    expect(seen.length).toBe(4);
  });

  it('V-008 usare come testo o come promessa ciò che Lua ha dato non fa girare Lua', async () => {
    let got: any;
    const { run, logs } = await sandbox((h) => {
      h.emit = (_n, data) => {
        got = data;
      };
    });
    run(`bus.emit('a', { toString = function() log('girato') while true do end end, ['then'] = function() log('girato') end })`);
    expect(String(got)).toBe('[object Object]');
    await Promise.resolve(got);
    expect(logs).toEqual([]);
  });

  it('V-008 tabelle con cicli, condivise e profondissime arrivano a JS come dati finiti, senza guasti', async () => {
    const got: any[] = [];
    const { run } = await sandbox((h) => {
      h.emit = (_n, data) => {
        got.push(data);
      };
    });
    const { fault } = run(`local a = { nome = 'a' } a.me = a a.lista = { a }
      bus.emit('ciclo', a)
      local s = { n = 1 } bus.emit('condivisa', { p = s, q = s })
      local deep = {} for i = 1, 100000 do deep = { d = deep } end
      bus.emit('profonda', deep)
      local dag = { 1 } for i = 1, 60 do dag = { l = dag, r = dag } end
      bus.emit('rete', dag)`);
    expect(fault).toBeUndefined();
    expect(got.length).toBe(4);
    expect(JSON.stringify(got[0])).toContain('"nome":"a"');
    expect(got[1].p).toBe(got[1].q);
    let depth = 0;
    for (let d = got[2]; d?.d; d = d.d) depth++;
    expect(depth).toBeLessThan(100);
    expect(got[3].l).toBe(got[3].r);
    expect(run('return 1 + 1').result).toBe(2);
  });

  it("V-008 i campi di una tabella data all'Host restano com'erano", async () => {
    let got: any;
    const { run } = await sandbox((h) => {
      h.emit = (_n, data) => {
        got = data;
      };
    });
    run(`bus.emit('a', { n = 1.5, s = 'x', b = true, lista = { 1, 2, 3 }, vuota = {}, [7] = 'sette', mista = { 1, k = 2 } })`);
    expect(got).toEqual({ n: 1.5, s: 'x', b: true, lista: [1, 2, 3], vuota: {}, 7: 'sette', mista: { 1: 1, k: 2 } });
  });

  it("V-008 una vista data di nuovo all'Host è l'oggetto vero", async () => {
    const component = { x: 1 };
    let got: unknown;
    const { run } = await sandbox((h) => {
      h.get = () => component;
      h.set = (_id, _name, data) => {
        got = data;
        return true;
      };
    });
    run(`ecs.set(1, 'c', ecs.get(1, 'c'))`);
    expect(got).toBe(component);
  });
});

describe('la prova di caricamento', () => {
  const forged = { id: 'item.sonda', name: 'Sonda', kind: 'entity', appearance: { glyph: 's', color: '#fff' } } as never;

  it('V-008 non lascia nulla nella sandbox viva', async () => {
    const { sb, run } = await sandbox();
    expect(new Validator(sb).validateForged(forged, `math.sonda = 'rimasto' string.sonda = 'rimasto' sonda = 'rimasto' return {}`, new Set())).toEqual([]);
    expect(run(`return tostring(math.sonda) .. tostring(string.sonda) .. tostring(sonda)`).result).toBe('nilnilnil');
  });

  it("V-008 non chiama l'Host vero", async () => {
    const calls: string[] = [];
    const { sb } = await sandbox((h) => {
      for (const name of Object.keys(h) as (keyof Host)[]) {
        const real = h[name] as (...a: unknown[]) => unknown;
        (h as any)[name] = (...a: unknown[]) => {
          calls.push(name);
          return real(...a);
        };
      }
    });
    const errors = new Validator(sb).validateForged(forged, `log('x') world.say('x') ecs.spawn({}) carpet.ox = 99 x = 5 world.set_tile(0, 0, 'g') return {}`, new Set());
    expect(errors).toEqual([]);
    expect(calls).toEqual([]);
  });

  it('V-008 una prova non vede ciò che ha lasciato la prova prima', async () => {
    const { sb } = await sandbox();
    const v = new Validator(sb);
    expect(v.validateForged(forged, `math.sonda = 1 sonda = 1 return {}`, new Set())).toEqual([]);
    expect(v.validateForged(forged, `assert(math.sonda == nil and sonda == nil, 'rimasto') return {}`, new Set())).toEqual([]);
  });

  it('V-008 dice ancora ciò che non si carica, e il ciclo infinito', async () => {
    const { sb } = await sandbox();
    const v = new Validator(sb);
    expect(v.validateForged(forged, `return 1`, new Set()).join()).toMatch(/tabella/);
    expect(v.validateForged(forged, `error('rotto')`, new Set()).join()).toMatch(/rotto/);
    expect(v.validateForged(forged, `while true do end return {}`, new Set()).join()).toMatch(/budget/);
  });

  it('V-008 un modulo provato non è caricato nel mondo', async () => {
    const { sb } = await sandbox();
    expect(new Validator(sb).validateForged(forged, `return { update = function() end }`, new Set())).toEqual([]);
    expect(sb.has('prova', 'update')).toBe(false);
    expect(sb.has('__probe.item.sonda', 'update')).toBe(false);
  });
});
