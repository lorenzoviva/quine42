// The sandbox's cases of the author's kit (T137), each in a process of its own with a time limit: a case that blocks in a C
// function cannot be interrupted from inside, so prove.mjs kills the process and that is the measure. The kernel's real
// Sandbox and Host, on the seed universe, local models, no network. Only harmless properties are asserted: what is
// reachable is reported by its type, nothing that is reached gets called.

import path from 'node:path';

const work = process.cwd();
const { createServer } = await import('vite');
const vite = await createServer({
  root: work,
  configFile: false,
  envFile: false,
  envDir: path.join(work, 'nessun-env'),
  cacheDir: path.join(work, '.cache-sandbox'),
  logLevel: 'error',
  appType: 'custom',
  resolve: { preserveSymlinks: true },
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, watch: null, hmr: false },
});
const load = (p) => vite.ssrLoadModule(p);

const say = (result) => {
  process.stdout.write(`\n${JSON.stringify(result)}\n`);
  process.exit(0);
};

async function bootKernel() {
  const { Kernel } = await load('/src/kernel/kernel.ts');
  const { bundledFiles } = await load('/src/kernel/bundle.ts');
  const { memoryStore } = await load('/src/kernel/repo.ts');
  const { MockAiModels } = await load('/src/kernel/ai/mock.ts');
  return Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() });
}

const faultOf = (kernel) => kernel.faults.list().find((f) => String(f.key).includes('prova'));

/** A module's function run through the kernel's real Sandbox; its fault, if any, comes from the kernel's faults. */
async function runUpdate(body) {
  const kernel = await bootKernel();
  const err = kernel.sandbox.loadModule('prova', `local M = {} function M.prova() ${body} end return M`);
  if (err) throw new Error(`modulo di prova non caricato: ${err}`);
  const started = Date.now();
  const result = kernel.sandbox.run('prova', 'prova', 0);
  return { result, fault: faultOf(kernel), ms: Date.now() - started };
}

// What the world gives to Lua, by the names modules use: anything JS would come through one of these.
const REACH = `
  local out, seen = {}, {}
  local function look(name, v)
    if (type(v) ~= 'table' and type(v) ~= 'userdata') or seen[v] then return end
    seen[v] = true
    for _, key in ipairs({ 'constructor', '__proto__', 'prototype', 'toString', 'hasOwnProperty', 'valueOf', '__lookupGetter__', 'then' }) do
      local ok, got = pcall(function() return v[key] end)
      if ok and got ~= nil then out[#out + 1] = name .. '.' .. key .. ':' .. type(got) end
    end
  end
  local me = world.player()
  look('carpet', carpet)
  look('player_pos', world.player_pos())
  look('pos', ecs.get(me, 'pos'))
  look('needs', ecs.get(me, 'needs'))
  look('inventory', ecs.get(me, 'inventory'))
  local id = next(items) and items.find and items.find('pane')
  if id then look('item_def', items.def(id)) end
  return table.concat(out, ' ')
`;

// Every string reachable from the environment of a module, walked like data.
const WALK = (marker) => `
  local seen, found = {}, 0
  local function walk(v, depth)
    if depth > 8 then return end
    if type(v) == 'string' then
      if string.find(v, '${marker}', 1, true) then found = found + 1 end
    elseif (type(v) == 'table' or type(v) == 'userdata') and not seen[v] then
      seen[v] = true
      for k, x in pairs(v) do walk(k, depth + 1) walk(x, depth + 1) end
    end
  end
  -- The environment of a module is empty: what it sees comes from __index, so it goes by name.
  for _, name in ipairs({ 'math', 'string', 'table', 'utf8', 'ecs', 'input', 'world', 'bus', 'inventory', 'items', 'ui', 'carpet' }) do walk(_ENV[name], 0) end
  local me = world.player()
  for _, name in ipairs({ 'pos', 'needs', 'inventory' }) do walk(ecs.get(me, name), 0) end
  return tostring(found)
`;

const CASES = {
  // The cases that may block: if they do not come back, the parent's time limit is the answer.
  pattern: async () => {
    const { fault, ms } = await runUpdate(`return string.find(string.rep('a', 3000), string.rep('.-', 24) .. 'x')`);
    return { ok: true, dettaglio: `finito in ${ms} ms${fault ? ', con un guasto' : ''}` };
  },
  allocazione: async () => {
    const { fault, ms } = await runUpdate(`return #string.rep('x', 200000000)`);
    return { ok: !!fault, dettaglio: `${ms} ms, ${fault ? 'un guasto' : 'nessun guasto'}` };
  },
  budget: async () => {
    const { fault, ms } = await runUpdate(`while true do pcall(function() while true do end end) end`);
    return { ok: !!fault, dettaglio: `${ms} ms, ${fault ? 'un guasto del budget' : 'nessun guasto'}` };
  },
  // Non-blocking cases, read together.
  proprieta: async () => {
    const marker = 'SONDA-AMBIENTE-V019';
    process.env.SONDA_V019 = marker;
    const kernel = await bootKernel();
    const sb = kernel.sandbox;
    const run = (name, src) => {
      const err = sb.loadModule(name, `local M = {} function M.prova() ${src} end return M`);
      if (err) return { errore: err };
      return { valore: sb.run(name, 'prova', 0) };
    };
    const reach = run('sonda.js', REACH);
    const walk = run('sonda.env', WALK(marker));
    const dump = run('sonda.dump', `local ok, f = pcall(function() return ('x').dump end) return ok and type(f) or 'nil'`);
    // A Lua function inside a table passed to the Host: what does the kernel's side receive?
    let seen = 'non arrivato';
    kernel.bus.on('lua:sonda:funzione', (data) => {
      seen = typeof data?.f;
    });
    run('sonda.fn', `bus.emit('sonda:funzione', { f = function() end }) return 'ok'`);
    // The dry load of a module not yet approved: does what it runs stay in the live sandbox?
    const errors = kernel.validator.validateForged({ id: 'item.sonda', name: 'Sonda', kind: 'entity', appearance: { glyph: 's', color: '#fff' } }, `math.sonda_v008 = 'rimasto' return {}`, new Set());
    const left = run('sonda.leftover', `return tostring(math.sonda_v008)`);
    return {
      js: reach.errore ? `errore: ${reach.errore}` : String(reach.valore ?? ''),
      ambiente: walk.errore ? `errore: ${walk.errore}` : String(walk.valore),
      dump: dump.errore ? `errore: ${dump.errore}` : String(dump.valore),
      funzione: seen,
      avanzo: left.errore ? `errore: ${left.errore}` : String(left.valore),
      prova: errors.length,
    };
  },
};

const name = process.argv[2];
try {
  if (!CASES[name]) throw new Error(`caso sconosciuto: ${name}`);
  say(await CASES[name]());
} catch (e) {
  say({ errore: String(e?.message ?? e).slice(0, 400) });
}
