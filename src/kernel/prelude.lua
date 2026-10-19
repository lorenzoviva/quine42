-- RUNE kernel prelude.
-- This file belongs to the KERNEL. Universe code (modules and runes) runs in environments that
-- cannot see _G, debug, load, os, io, package or this file's locals: it can break the universe,
-- never the kernel.

local host = __host
__host = nil

local sethook = debug.sethook
local load, pcall, error, assert, type, tostring, tonumber, next =
  load, pcall, error, assert, type, tostring, tonumber, next
local setmetatable, rawset, pairs, ipairs, select = setmetatable, rawset, pairs, ipairs, select
local gmatch, match, format, concat, pack, unpack =
  string.gmatch, string.match, string.format, table.concat, table.pack, table.unpack
local mtype, floor = math.type, math.floor

-- VM instructions allowed per call into universe code. Exceeding it is a fault, not a hang.
local BUDGET = 2000000

local K = {}
local modules = {}  -- id -> table returned by the module's logic
local lines = {}    -- rune line key -> { f = compiled, expr = boolean }
local U             -- the universe environment shared by modules and runes
local bindings      -- live symbols bound to kernel state (x, y, carpet, ...)
local overrides     -- bindings that universe code reassigned (e.g. `carpet = nil`)

local getinfo = debug.getinfo
local guarded

local function budget_exceeded()
  -- The kernel's own frame (after pcall returned) is exempt.
  if getinfo(2, "f").func == guarded then return end
  -- From now on every instruction errors, so a pcall inside a loop cannot swallow it.
  sethook(budget_exceeded, "", 1)
  error("budget di istruzioni esaurito (ciclo infinito?)", 2)
end

function guarded(f, ...)
  sethook(budget_exceeded, "", BUDGET)
  local r = pack(pcall(f, ...))
  sethook()
  return r[1], r[2]
end

local function copy(t)
  local c = {}
  for k, v in pairs(t) do c[k] = v end
  return c
end

local function fmt(v)
  local t = type(v)
  if t == "number" then
    if mtype(v) == "integer" then return tostring(v) end
    return format("%.3f", v)
  elseif t == "string" then
    return format("%q", v)
  elseif t == "userdata" then
    return host.describe(v)
  end
  return tostring(v)
end

local function mix(h, v)
  v = floor(tonumber(v) or 0)
  h = ((h ~ (v & 0xffffffff)) * 16777619) & 0xffffffff
  h = h ~ (h >> 13)
  h = (h * 0x5bd1e995) & 0xffffffff
  return h ~ (h >> 15)
end

-- Deterministic hash in [0,1) of up to 4 integer arguments. Pure: safe for stateless systems.
local function hash(a, b, c, d)
  local h = mix(2166136261, a)
  if b ~= nil then h = mix(h, b) end
  if c ~= nil then h = mix(h, c) end
  if d ~= nil then h = mix(h, d) end
  return h / 4294967296
end

local function split(names)
  local list = {}
  for n in gmatch(names, "[^,%s]+") do list[#list + 1] = n end
  return list
end

local function make_api()
  local ecs = {}
  function ecs.each(names, fn)
    local list = split(names)
    local n = #list
    for sid in gmatch(host.query(names), "%d+") do
      local id = tonumber(sid)
      local c = {}
      for i = 1, n do c[i] = host.get(id, list[i]) end
      fn(id, unpack(c, 1, n))
    end
  end
  function ecs.get(id, name) return host.get(id, name) end
  function ecs.spawn(components) return host.spawn(components) end
  function ecs.destroy(id) host.destroy(id) end
  function ecs.first(name) return host.first(name) end

  local input = { held = function(action) return host.held(action) end }
  local world = {
    free = function(x, y, r) return host.free(x, y, r or 0) end,
    free_real = function(x, y, r) return host.free_real(x, y, r or 0) end,
    tile = function(x, y) return host.tile(x, y) end,
  }
  local bus = { emit = function(name, data) host.emit(tostring(name), data) end }
  local function log(...)
    local parts = {}
    for i = 1, select("#", ...) do
      local v = (select(i, ...))
      parts[i] = type(v) == "string" and v or fmt(v)
    end
    host.log(concat(parts, " "))
  end
  return ecs, input, world, bus, log
end

local function player_binding(key)
  return {
    get = function() return host.player_get(key) end,
    set = function(v)
      local err = host.player_set(key, v)
      if err then error(err, 3) end
    end,
  }
end

function K.reset()
  overrides = {}
  bindings = {
    x = player_binding("x"),
    y = player_binding("y"),
    speed = player_binding("speed"),
    -- No setter: reassigning these replaces the symbol itself (and whoever depends on it breaks).
    carpet = { get = function() return host.carpet() end },
    time = { get = function() return host.time() end },
  }
  local ecs, input, world, bus, log = make_api()
  local base = {
    math = copy(math), string = copy(string), table = copy(table), utf8 = copy(utf8),
    pairs = pairs, ipairs = ipairs, next = next, select = select, type = type,
    tostring = tostring, tonumber = tonumber, pcall = pcall, error = error, assert = assert,
    unpack = unpack, print = log, log = log, hash = hash,
    ecs = ecs, input = input, world = world, bus = bus,
  }
  base.string.dump = nil
  U = setmetatable(base, {
    __index = function(_, k)
      local o = overrides[k]
      if o then return o[1] end
      local b = bindings[k]
      if b then return b.get() end
      return nil
    end,
    __newindex = function(t, k, v)
      local b = bindings[k]
      if b then
        if b.set then b.set(v) else overrides[k] = { v } end
        return
      end
      rawset(t, k, v)
    end,
  })
  modules = {}
  lines = {}
end

-- Modules -------------------------------------------------------------------------------------

function K.load_module(id, src, chunkname)
  local env = setmetatable({}, { __index = function(_, k) return U[k] end })
  local f, err = load(src, "@" .. (chunkname or id), "t", env)
  if not f then return tostring(err) end
  local ok, M = guarded(f)
  if not ok then return tostring(M) end
  if type(M) ~= "table" then return "il modulo deve restituire una tabella (return M)" end
  modules[id] = M
  return nil
end

function K.unload_module(id) modules[id] = nil end

function K.has(id, fname)
  local M = modules[id]
  return M ~= nil and type(M[fname]) == "function"
end

function K.run(id, fname, a, b, c, d)
  local M = modules[id]
  if not M then return nil end
  local f = M[fname]
  if type(f) ~= "function" then return nil end
  local ok, r = guarded(f, a, b, c, d)
  if not ok then
    host.fault("module:" .. id .. ":" .. fname, tostring(r))
    return nil
  end
  return r
end

-- Validation ----------------------------------------------------------------------------------

function K.check(src, chunkname)
  local f, err = load(src, "@" .. chunkname, "t", {})
  if f then return nil end
  return tostring(err)
end

local function compile_rune(src)
  local f = load("return " .. src, "=runa", "t", U)
  if f then return f, true end
  local g, err = load(src, "=runa", "t", U)
  if g then return g, false end
  return nil, err
end

-- "expr" | "stmt" | "error: <message>"
function K.rune_kind(src)
  local f, r = compile_rune(src)
  if not f then return "error: " .. tostring(r) end
  return r and "expr" or "stmt"
end

-- Rune lines: what is written on the carpet runs, every tick -----------------------------------

function K.set_line(key, src)
  local f, r = compile_rune(src)
  if not f then
    lines[key] = nil
    return tostring(r)
  end
  lines[key] = { f = f, expr = r }
  return nil
end

function K.remove_line(key) lines[key] = nil end

function K.run_line(key)
  local l = lines[key]
  if not l then return nil end
  local ok, r = guarded(l.f)
  if not ok then
    host.fault("rune:" .. key, tostring(r))
    return nil
  end
  if l.expr then return fmt(r) end
  return "✓"
end

-- Read a symbol (identifier or dotted path) for tooltips. Never calls functions.
function K.eval(src)
  if not match(src, "^[%a_][%w_]*[%w_%.]*$") then return nil end
  local f = load("return " .. src, "=eval", "t", U)
  if not f then return nil end
  local ok, r = guarded(f)
  if not ok then return "errore: " .. tostring(r) end
  return fmt(r)
end

K.reset()
return K
