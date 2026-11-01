-- RUNE kernel prelude.
-- This file belongs to the KERNEL. Universe code (modules and runes) runs in environments that
-- cannot see _G, debug, load, os, io, package or this file's locals: it can break the universe,
-- never the kernel.

local host = __host
__host = nil
-- What the kernel's allocator measures (sandbox.ts): on while universe code runs, it gives back the bytes allocated.
local meter = __meter
__meter = nil

-- From the real table: the strings' metatable points to it, so a copy without it would not be enough.
string.dump = nil

local sethook = debug.sethook
local load, pcall, error, assert, type, tostring, tonumber, next =
  load, pcall, error, assert, type, tostring, tonumber, next
local setmetatable, rawset, pairs, ipairs, select = setmetatable, rawset, pairs, ipairs, select
local gmatch, match, format, concat, pack, unpack =
  string.gmatch, string.match, string.format, table.concat, table.pack, table.unpack
local mtype, floor = math.type, math.floor
local randomseed = math.randomseed
local clock = os.clock
local byte, char, sub, strfind, tconcat, tinsert, tremove, tmove, tsort =
  string.byte, string.char, string.sub, string.find, table.concat, table.insert, table.remove, table.move, table.sort
local utf8len, utf8codepoint, utf8offset = utf8.len, utf8.codepoint, utf8.offset

-- The limits of universe code (ADR-0103). Exceeding one is a fault, not a hang.
-- VM instructions per call into universe code, and for all of a tick (work in C functions counts in both).
local BUDGET = 2000000
local TICK_BUDGET = 12000000
-- How often the hook runs, in instructions: it is the only thing that can stop a Lua function.
local SLICE = 4096
-- The net under what cannot be measured (comparing long strings, `next` on an emptied table), the only clock of the
-- simulation (ADR-0055): the same in every kernel unless the world is already stuck.
local CALL_SECONDS = 2
-- Allocated bytes per instruction of the tick budget.
local CHURN_WEIGHT = 16
-- Also enforced by the allocator (sandbox.ts), on every string however it is made.
local MAX_STRING = 1048576
local MAX_PATTERN = 1024
-- Values a call may spread on the stack (`unpack`, `string.byte`, `utf8.codepoint`) and elements `table.move` may move.
local MAX_RESULTS = 8192
local MAX_MOVE = 1048576
-- Above this worst case a pattern runs in Lua, where the budget counts it; below, in C, charged for its worst case.
local NATIVE_PATTERN = 16384
local PATTERN_WEIGHT = 16
local MAX_CAPTURES = 32
local MAX_MATCH_DEPTH = 200
local MEMORY_ERROR = "not enough memory"
local CLIP = 400

local K = {}
local modules = {}  -- id -> table returned by the module's logic
local lines = {}    -- rune line key -> { f = compiled, expr = boolean }
local U             -- the universe environment shared by modules and runes
local bindings      -- live symbols bound to kernel state (x, y, carpet, ...)
local overrides     -- bindings that universe code reassigned (e.g. `carpet = nil`)
local locked = false -- a line of a wanderer who may not write the bindings is running (T37)

local getinfo = debug.getinfo
local guarded, finish

local spent = 0         -- instructions of this call (the innermost: calls can nest through the Host)
local depth = 0         -- how many calls into universe code are open
local started = 0       -- when the outermost began
local tick_open = false -- between tick_begin and tick_end
local tick_spent = 0
local tick_skipped = 0  -- calls not made because the tick had no budget left
local exempt = false    -- core.*: the floor of the tick runs even when the budget is gone
local why               -- what ran out

local function poisoned()
  -- The kernel's own frames (after pcall returned) are exempt.
  local f = getinfo(2, "f").func
  if f == guarded or f == finish then return end
  error(why, 2)
end

-- From now on every instruction errors, so a pcall inside a loop cannot swallow it.
local function exhausted(message, level)
  why = message
  sethook(poisoned, "", 1)
  error(message, level)
end

local function overrun()
  if spent > BUDGET then return "budget di istruzioni esaurito (ciclo infinito?)" end
  if tick_open and not exempt and tick_spent > TICK_BUDGET then return "budget del tick esaurito" end
  return nil
end

-- Work done in C, which the hook does not see.
local function charge(n)
  spent = spent + n
  if tick_open then tick_spent = tick_spent + n end
  local message = overrun()
  if message then exhausted(message, 4) end
end

local function slice()
  spent = spent + SLICE
  if tick_open then tick_spent = tick_spent + SLICE end
  local message = overrun() or (clock() - started > CALL_SECONDS and "tempo della chiamata esaurito")
  if not message then return end
  local f = getinfo(2, "f").func
  if f == guarded or f == finish then return end
  exhausted(message, 3)
end

function finish(outer, ok, r)
  sethook()
  local churn = meter(false)
  depth = depth - 1
  spent = outer
  if tick_open then tick_spent = tick_spent + churn // CHURN_WEIGHT end
  return ok, r
end

function guarded(f, ...)
  local outer = spent
  spent = 0
  if depth == 0 then started = clock() end
  depth = depth + 1
  meter(true)
  sethook(slice, "", SLICE)
  return finish(outer, pcall(f, ...))
end

-- What a fault says of an error: short, whatever the code threw.
local function reason(r)
  local text = tostring(r)
  if strfind(text, MEMORY_ERROR, 1, true) then return "memoria esaurita (limite della sandbox)" end
  if #text > CLIP then return sub(text, 1, CLIP) .. "…" end
  return text
end

-- A pcall of universe code cannot go on after running out of memory: every new failure would cost a full collection.
local function after_pcall(ok, ...)
  if not ok and (...) == MEMORY_ERROR then exhausted(MEMORY_ERROR, 0) end
  return ok, ...
end
local function safe_pcall(f, ...) return after_pcall(pcall(f, ...)) end

-- Patterns ------------------------------------------------------------------------------------
-- The C matcher backtracks with no way to stop it: its cost is bounded here before it runs. A pattern that could cost too
-- much runs in the same matcher written in Lua (a port of lstrlib.c, same results and same errors), where the hook counts it.

local CAP_UNFINISHED, CAP_POSITION = -1, -2
local CLASSES = {}

local function in_class(c, cl)
  if cl < 65 or cl > 122 or (cl > 90 and cl < 97) then return cl == c end
  local set = CLASSES[cl]
  if set == nil then
    -- From the C matcher itself; a letter that is no class matches only itself, which is what C does too.
    local letter = char(cl)
    set = {}
    for i = 0, 255 do set[i] = strfind(char(i), "%" .. letter) ~= nil end
    CLASSES[cl] = set
  end
  return set[c]
end

local function class_end(pat, p)
  local c = byte(pat, p)
  p = p + 1
  if c == 37 then
    if p > #pat then error("malformed pattern (ends with '%')", 0) end
    return p + 1
  elseif c == 91 then
    if byte(pat, p) == 94 then p = p + 1 end
    repeat
      if p > #pat then error("malformed pattern (missing ']')", 0) end
      local d = byte(pat, p)
      p = p + 1
      if d == 37 and p <= #pat then p = p + 1 end
    until byte(pat, p) == 93
    return p + 1
  end
  return p
end

local function in_bracket(pat, c, p, ec)
  local sig = true
  if byte(pat, p + 1) == 94 then
    sig = false
    p = p + 1
  end
  p = p + 1
  while p < ec do
    local d = byte(pat, p)
    if d == 37 then
      p = p + 1
      if in_class(c, byte(pat, p)) then return sig end
    elseif byte(pat, p + 1) == 45 and p + 2 < ec then
      if d <= c and c <= byte(pat, p + 2) then return sig end
      p = p + 2
    elseif d == c then
      return sig
    end
    p = p + 1
  end
  return not sig
end

local function single(ms, s, p, ep)
  if s > ms.slen then return false end
  local c, d = byte(ms.src, s), byte(ms.pat, p)
  if d == 46 then return true end
  if d == 37 then return in_class(c, byte(ms.pat, p + 1)) end
  if d == 91 then return in_bracket(ms.pat, c, p, ep - 1) end
  return d == c
end

local do_match

local function balance(ms, s, p)
  if p + 1 > ms.plen then error("malformed pattern (missing arguments to '%b')", 0) end
  local src = ms.src
  if s > ms.slen or byte(src, s) ~= byte(ms.pat, p) then return nil end
  local b, e, open = byte(ms.pat, p), byte(ms.pat, p + 1), 1
  s = s + 1
  while s <= ms.slen do
    local c = byte(src, s)
    if c == e then
      open = open - 1
      if open == 0 then return s + 1 end
    elseif c == b then
      open = open + 1
    end
    s = s + 1
  end
  return nil
end

local function max_expand(ms, s, p, ep)
  local i = 0
  while single(ms, s + i, p, ep) do i = i + 1 end
  while i >= 0 do
    local r = do_match(ms, s + i, ep + 1)
    if r then return r end
    i = i - 1
  end
  return nil
end

local function min_expand(ms, s, p, ep)
  while true do
    local r = do_match(ms, s, ep + 1)
    if r then return r end
    if not single(ms, s, p, ep) then return nil end
    s = s + 1
  end
end

local function start_capture(ms, s, p, what)
  local level = ms.level
  if level >= MAX_CAPTURES then error("too many captures", 0) end
  ms.init[level] = s
  ms.len[level] = what
  ms.level = level + 1
  local r = do_match(ms, s, p)
  if not r then ms.level = ms.level - 1 end
  return r
end

local function end_capture(ms, s, p)
  local l
  for level = ms.level - 1, 0, -1 do
    if ms.len[level] == CAP_UNFINISHED then
      l = level
      break
    end
  end
  if not l then error("invalid pattern capture", 0) end
  ms.len[l] = s - ms.init[l]
  local r = do_match(ms, s, p)
  if not r then ms.len[l] = CAP_UNFINISHED end
  return r
end

local function same_capture(ms, s, d)
  local l = d - 49
  if l < 0 or l >= ms.level or ms.len[l] == CAP_UNFINISHED then error("invalid capture index %" .. (l + 1), 0) end
  local n = ms.len[l]
  if n < 0 or ms.slen - s + 1 < n then return nil end
  local from = ms.init[l]
  if sub(ms.src, from, from + n - 1) == sub(ms.src, s, s + n - 1) then return s + n end
  return nil
end

-- The body of do_match: the end of the match, or nil.
local function match_here(ms, s, p)
  local pat, plen = ms.pat, ms.plen
  while p <= plen do
    local c = byte(pat, p)
    local d = c == 37 and byte(pat, p + 1) or nil
    if c == 40 then
      if byte(pat, p + 1) == 41 then return start_capture(ms, s, p + 2, CAP_POSITION) end
      return start_capture(ms, s, p + 1, CAP_UNFINISHED)
    elseif c == 41 then
      return end_capture(ms, s, p + 1)
    elseif c == 36 and p == plen then
      if s == ms.slen + 1 then return s end
      return nil
    elseif d == 98 then
      s = balance(ms, s, p + 2)
      if not s then return nil end
      p = p + 4
    elseif d == 102 then
      p = p + 2
      if byte(pat, p) ~= 91 then error("missing '[' after '%f' in pattern", 0) end
      local ep = class_end(pat, p)
      local before = s == 1 and 0 or byte(ms.src, s - 1)
      local here = s <= ms.slen and byte(ms.src, s) or 0
      if in_bracket(pat, before, p, ep - 1) or not in_bracket(pat, here, p, ep - 1) then return nil end
      p = ep
    elseif d and d >= 48 and d <= 57 then
      s = same_capture(ms, s, d)
      if not s then return nil end
      p = p + 2
    else
      local ep = class_end(pat, p)
      local q = byte(pat, ep)
      if not single(ms, s, p, ep) then
        if q ~= 42 and q ~= 63 and q ~= 45 then return nil end
        p = ep + 1
      elseif q == 63 then
        local r = do_match(ms, s + 1, ep + 1)
        if r then return r end
        p = ep + 1
      elseif q == 43 then
        return max_expand(ms, s + 1, p, ep)
      elseif q == 42 then
        return max_expand(ms, s, p, ep)
      elseif q == 45 then
        return min_expand(ms, s, p, ep)
      else
        s = s + 1
        p = ep
      end
    end
  end
  return s
end

function do_match(ms, s, p)
  if ms.depth == 0 then error("pattern too complex", 0) end
  ms.depth = ms.depth - 1
  local r = match_here(ms, s, p)
  ms.depth = ms.depth + 1
  return r
end

local function new_match(src, pat)
  return { src = src, pat = pat, slen = #src, plen = #pat, level = 0, depth = MAX_MATCH_DEPTH, init = {}, len = {} }
end

local function again(ms)
  ms.level = 0
  ms.depth = MAX_MATCH_DEPTH
end

local function one_capture(ms, i, s, e)
  if i >= ms.level then
    if i ~= 0 then error("invalid capture index %" .. (i + 1), 0) end
    return sub(ms.src, s, e - 1)
  end
  local n = ms.len[i]
  if n == CAP_UNFINISHED then error("unfinished capture", 0) end
  if n == CAP_POSITION then return ms.init[i] end
  return sub(ms.src, ms.init[i], ms.init[i] + n - 1)
end

-- Every capture, and the whole match if `whole` and there are none.
local function captures(ms, s, e, whole)
  local n = (ms.level == 0 and whole) and 1 or ms.level
  local out = {}
  for i = 1, n do out[i] = one_capture(ms, i - 1, s, e) end
  return unpack(out, 1, n)
end

local function start_of(init, n)
  if init == nil then return 1 end
  if init > 0 then return init end
  if init == 0 or init < -n then return 1 end
  return n + init + 1
end

local function lua_find(src, pat, init, is_find)
  local from = start_of(init, #src)
  if from > #src + 1 then return nil end
  local anchor = byte(pat, 1) == 94
  local p = anchor and 2 or 1
  local ms = new_match(src, pat)
  local s = from
  repeat
    again(ms)
    local e = do_match(ms, s, p)
    if e then
      if is_find then return s, e - 1, captures(ms, s, e, false) end
      return captures(ms, s, e, true)
    end
    s = s + 1
  until s > ms.slen + 1 or anchor
  return nil
end

local function lua_gmatch(src, pat, init)
  local ms = new_match(src, pat)
  local s = start_of(init, #src)
  local last
  return function()
    while s <= ms.slen + 1 do
      again(ms)
      local e = do_match(ms, s, 1)
      if e and e ~= last then
        local from = s
        s = e
        last = e
        return captures(ms, from, e, true)
      end
      s = s + 1
    end
    return nil
  end
end

local function expand(ms, repl, s, e, out)
  local i, n = 1, #repl
  while i <= n do
    local percent = strfind(repl, "%", i, true)
    if not percent then
      out[#out + 1] = sub(repl, i)
      return
    end
    out[#out + 1] = sub(repl, i, percent - 1)
    local d = byte(repl, percent + 1)
    if d == 37 then
      out[#out + 1] = "%"
    elseif d == 48 then
      out[#out + 1] = sub(ms.src, s, e - 1)
    elseif d and d >= 49 and d <= 57 then
      out[#out + 1] = tostring(one_capture(ms, d - 49, s, e))
    else
      error("invalid use of '%' in replacement string", 0)
    end
    i = percent + 2
  end
end

local function lua_gsub(src, pat, repl, limit)
  local kind = type(repl)
  local anchor = byte(pat, 1) == 94
  local p = anchor and 2 or 1
  local ms = new_match(src, pat)
  local max = limit or ms.slen + 1
  local s, n, last, out = 1, 0, nil, {}
  while n < max do
    again(ms)
    local e = do_match(ms, s, p)
    if e and e ~= last then
      n = n + 1
      if kind == "string" then
        expand(ms, repl, s, e, out)
      else
        local v
        if kind == "table" then v = repl[one_capture(ms, 0, s, e)]
        else v = repl(captures(ms, s, e, true)) end
        if not v then
          out[#out + 1] = sub(src, s, e - 1)
        elseif type(v) == "string" or mtype(v) then
          out[#out + 1] = tostring(v)
        else
          error("invalid replacement value (a " .. type(v) .. ")", 0)
        end
      end
      s = e
      last = e
    elseif s <= ms.slen then
      out[#out + 1] = sub(src, s, s)
      s = s + 1
    else
      break
    end
    if anchor then break end
  end
  if s <= ms.slen then out[#out + 1] = sub(src, s) end
  return tconcat(out), n
end

-- The most steps the C matcher can take on `n` characters, or nil if the pattern is not well formed (the error, then, comes
-- from the Lua matcher, not after who knows how much backtracking in C). Every repetition, %b and back-reference chooses
-- how far to go: k of them on n characters are C(n + k, k) ways, for each starting position and each pattern character.
local function pattern_cost(n, pat)
  local m, p, k, q = #pat, 1, 0, 0
  while p <= m do
    local c, d = byte(pat, p), byte(pat, p + 1)
    local item = true
    if c == 40 or c == 41 then
      p = p + 1
      item = false
    elseif c == 37 then
      if not d then return nil end
      if d == 98 then
        if p + 3 > m then return nil end
        k = k + 1
        p = p + 4
        item = false
      elseif d == 102 then
        p = p + 2
        if byte(pat, p) ~= 91 then return nil end
        local ok, ep = pcall(class_end, pat, p)
        if not ok then return nil end
        p = ep
        item = false
      elseif d >= 48 and d <= 57 then
        k = k + 1
        p = p + 2
        item = false
      else
        p = p + 2
      end
    elseif c == 91 then
      local ok, ep = pcall(class_end, pat, p)
      if not ok then return nil end
      p = ep
    else
      p = p + 1
    end
    if item then
      local e = byte(pat, p)
      if e == 42 or e == 43 or e == 45 then
        k = k + 1
        p = p + 1
      elseif e == 63 then
        q = q + 1
        p = p + 1
      end
    end
  end
  local cost = (n + 1.0) * (m + 1)
  for i = 1, k do
    cost = cost * (n + i) / i
    if cost > NATIVE_PATTERN then return cost end
  end
  for _ = 1, q do
    cost = cost * 2
    if cost > NATIVE_PATTERN then return cost end
  end
  return cost
end

-- True if the C matcher may do it, already charged.
local function native_pattern(src, pat)
  if #pat > MAX_PATTERN then error("pattern troppo lungo", 3) end
  local cost = pattern_cost(#src, pat)
  if not cost or cost > NATIVE_PATTERN then return false end
  charge(cost // PATTERN_WEIGHT + 1)
  return true
end

-- As string.* and table.* do: a number where a string goes, a numeric string where a number goes. What is neither stays as
-- it is and the C function refuses it, at no cost.
local function str(v)
  if mtype(v) then return tostring(v) end
  return v
end

local function num(v)
  if type(v) == "string" then return tonumber(v) or v end
  return v
end

local function is_int(v) return v == nil or (mtype(v) ~= nil and v == floor(v)) end

-- The same characters C looks for: `)` and `]` alone leave a pattern plain.
local function plain_text(p) return not strfind(p, "[%^%$%*%+%?%.%(%[%%%-]") end

-- How many values [i, j] of a sequence of n would give.
local function span(n, i, j)
  local a, b = start_of(i, n), j or i or 1
  if b < 0 then b = n + b + 1 elseif b > n then b = n end
  return b - a + 1
end

-- The limits of the standard library, in the real tables: the strings' metatable points to `string`.
local native = { find = string.find, match = string.match, gmatch = string.gmatch, gsub = string.gsub, rep = string.rep,
  byte = string.byte, unpack = table.unpack, concat = table.concat, tonumber = tonumber }

local function linear(fn)
  return function(s, ...)
    if type(s) == "string" then charge(#s // 8) end
    return fn(s, ...)
  end
end

function string.find(s, p, init, plain)
  s, p, init = str(s), str(p), num(init)
  if type(s) ~= "string" or type(p) ~= "string" or not is_int(init) then return native.find(s, p, init, plain) end
  if plain or plain_text(p) then
    charge((#s + 1) * (#p + 1) // PATTERN_WEIGHT + 1)
    return native.find(s, p, init, true)
  end
  if native_pattern(s, p) then return native.find(s, p, init) end
  return lua_find(s, p, init and floor(init), true)
end

function string.match(s, p, init)
  s, p, init = str(s), str(p), num(init)
  if type(s) ~= "string" or type(p) ~= "string" or not is_int(init) or native_pattern(s, p) then return native.match(s, p, init) end
  return lua_find(s, p, init and floor(init), false)
end

function string.gmatch(s, p, init)
  s, p, init = str(s), str(p), num(init)
  if type(s) ~= "string" or type(p) ~= "string" or not is_int(init) or native_pattern(s, p) then return native.gmatch(s, p, init) end
  return lua_gmatch(s, p, init and floor(init))
end

function string.gsub(s, p, repl, limit)
  s, p, repl, limit = str(s), str(p), str(repl), num(limit)
  local kind = type(repl)
  if type(s) ~= "string" or type(p) ~= "string" or (kind ~= "string" and kind ~= "table" and kind ~= "function") or not is_int(limit) or native_pattern(s, p) then
    return native.gsub(s, p, repl, limit)
  end
  return lua_gsub(s, p, repl, limit and floor(limit))
end

function string.rep(s, n, sep)
  s, n, sep = str(s), num(n), str(sep)
  if type(s) == "string" and mtype(n) and (sep == nil or type(sep) == "string") and n > 0 then
    -- The count alone too: with an empty string C would loop over it, allocating nothing.
    local total = (#s + (sep and #sep or 0)) * (n + 0.0)
    if n > MAX_STRING or total > MAX_STRING then error("string.rep: stringa troppo lunga", 2) end
    charge(floor(total) // 8)
  end
  return native.rep(s, n, sep)
end

function string.byte(s, i, j)
  s, i, j = str(s), num(i), num(j)
  if type(s) == "string" and is_int(i) and is_int(j) and span(#s, i, j) > MAX_RESULTS then error("string.byte: troppi valori", 2) end
  return native.byte(s, i, j)
end

string.lower, string.upper, string.reverse = linear(string.lower), linear(string.upper), linear(string.reverse)
string.pack, string.unpack = linear(string.pack), linear(string.unpack)
utf8.len, utf8.offset = linear(utf8len), linear(utf8offset)

function utf8.codepoint(s, i, j, lax)
  s, i, j = str(s), num(i), num(j)
  if type(s) == "string" and is_int(i) and is_int(j) then
    if span(#s, i, j) > MAX_RESULTS then error("utf8.codepoint: troppi valori", 2) end
    charge(#s // 8)
  end
  return utf8codepoint(s, i, j, lax)
end

function table.unpack(t, i, j)
  i, j = num(i), num(j)
  if is_int(i) and is_int(j) then
    local kind = type(t)
    local count = (j or ((kind == "table" or kind == "string") and #t or 0)) - (i or 1) + 1.0
    if count > MAX_RESULTS then error("table.unpack: troppi valori", 2) end
    if count > 0 then charge(floor(count)) end
  end
  return native.unpack(t, i, j)
end

function table.concat(t, sep, i, j)
  i, j = num(i), num(j)
  if type(t) == "table" and is_int(i) and is_int(j) then
    local count = (j or #t) - (i or 1) + 1.0
    if count > 0 then charge(count >= MAX_MOVE and MAX_MOVE or floor(count)) end
  end
  return native.concat(t, sep, i, j)
end

local function shifting(t, pos)
  pos = num(pos)
  if type(t) == "table" and mtype(pos) then
    local shift = #t - pos
    if shift > 0 then charge(shift) end
  end
end

function table.insert(t, ...)
  if select("#", ...) == 2 then shifting(t, (...)) end
  return tinsert(t, ...)
end

function table.remove(t, ...)
  if select("#", ...) == 1 then shifting(t, (...)) end
  return tremove(t, ...)
end

function table.move(a, f, e, t, b)
  local from, to = num(f), num(e)
  if mtype(from) and mtype(to) then
    local count = (to + 0.0) - from + 1
    if count > MAX_MOVE then error("table.move: troppi elementi", 2) end
    if count > 0 then charge(floor(count)) end
  end
  return tmove(a, f, e, t, b)
end

function table.sort(t, f)
  if type(t) == "table" then
    local n, log = #t, 1
    while (1 << log) < n do log = log + 1 end
    charge(n * log)
  end
  return tsort(t, f)
end

local function safe_tonumber(v, base)
  if type(v) == "string" then charge(#v // 8) end
  return native.tonumber(v, base)
end

-- What ends up in the kernel's lists stays short.
local function clipped(text)
  if #text > 4 * CLIP then return sub(text, 1, 4 * CLIP) end
  return text
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
    if #v > CLIP then v = sub(v, 1, CLIP) end
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
  function ecs.set(id, name, data) return host.set(id, tostring(name), data) end
  function ecs.spawn(components) return host.spawn(components) end
  function ecs.destroy(id) host.destroy(id) end
  function ecs.first(name) return host.first(name) end

  local input = { held = function(action) return host.held(action) end }
  local world = {
    free = function(x, y, r, z) return host.free(x, y, r or 0, z) end,
    free_real = function(x, y, r, z) return host.free_real(x, y, r or 0, z) end,
    tile = function(x, y) return host.tile(x, y) end,
    speed_at = function(x, y) return host.speed_at(x, y) end,
    spawn = function(module, x, y) return host.spawn_module(tostring(module), x, y) end,
    player = function() return host.player_id() end,
    player_pos = function() return host.player_pos() end,
    nearest = function(x, y, r, tag) return host.nearest(x, y, r or 1, tag) end,
    has_tag = function(id, tag) return host.has_tag(id, tostring(tag)) end,
    break_entity = function(id) host.break_entity(id) end,
    say = function(text) host.say(clipped(tostring(text))) end,
    speak = function(id, text) host.speak(id, clipped(tostring(text))) end,
    set_tile = function(x, y, code) return host.set_tile(x, y, tostring(code)) end,
    open = function(id) return host.open(id) end,
    make_container = function(id, size, loot) return host.make_container(id, size or 6, tostring(loot or "cassa")) end,
  }
  local inventory = {
    add = function(id, item, n) return host.inv_add(id, tostring(item), n or 1) end,
    remove = function(id, item, n) return host.inv_remove(id, tostring(item), n or 1) end,
    count = function(id, item) return host.inv_count(id, tostring(item)) end,
    equipped = function(id) return host.inv_equipped(id) end,
  }
  local items = {
    find = function(name) return host.item_find(tostring(name)) end,
    def = function(id) return host.item_def(tostring(id)) end,
    bonus = function(id, name) return host.item_bonus(tostring(id), tostring(name)) end,
  }
  -- Interfaces of modules: what sits in a slot of a panel.
  local ui = { slot = function(panel, slot) return host.slot_get(tostring(panel), tostring(slot)) end }
  local bus = { emit = function(name, data) host.emit(tostring(name), data) end }
  local function log(...)
    local parts = {}
    for i = 1, select("#", ...) do
      local v = (select(i, ...))
      parts[i] = type(v) == "string" and v or fmt(v)
    end
    host.log(clipped(concat(parts, " ")))
  end
  return ecs, input, world, bus, log, inventory, items, ui
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
  randomseed(0)
  overrides = {}
  bindings = {
    x = player_binding("x"),
    y = player_binding("y"),
    speed = player_binding("speed"),
    -- No setter: reassigning these replaces the symbol itself (and whoever depends on it breaks).
    carpet = { get = function() return host.carpet() end },
    time = { get = function() return host.time() end },
  }
  local ecs, input, world, bus, log, inventory, items, ui = make_api()
  local base = {
    math = copy(math), string = copy(string), table = copy(table), utf8 = copy(utf8),
    pairs = pairs, ipairs = ipairs, next = next, select = select, type = type,
    tostring = tostring, tonumber = safe_tonumber, pcall = safe_pcall, error = error, assert = assert,
    unpack = table.unpack, print = log, log = log, hash = hash,
    ecs = ecs, input = input, world = world, bus = bus, inventory = inventory, items = items, ui = ui,
  }
  -- Shared seeds (T35): the kernel reseeds before every call into universe code; reseeding from the
  -- universe is allowed, but never from the clock (Lua's randomseed() without arguments reads it).
  base.math.randomseed = function(a, b) randomseed(floor(tonumber(a) or 0), floor(tonumber(b) or 0)) end
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
        -- In a game of many only the master moves the carpet: the others' writes go nowhere (T37).
        if locked then return end
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
  if not ok then return reason(M) end
  if type(M) ~= "table" then return "il modulo deve restituire una tabella (return M)" end
  modules[id] = M
  return nil
end

-- The random generator of universe code, from (universe seed, tick, module, entity): see Kernel.seedLua.
function K.seed(n) randomseed(floor(n)) end

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
  local core = sub(id, 1, 5) == "core."
  if tick_open and not core and tick_spent > TICK_BUDGET then
    tick_skipped = tick_skipped + 1
    return nil
  end
  local outer = exempt
  exempt = core
  local ok, r = guarded(f, a, b, c, d)
  exempt = outer
  if not ok then
    host.fault("module:" .. id .. ":" .. fname, reason(r))
    return nil
  end
  return r
end

-- The tick's budget (ADR-0103): universe code from here to tick_end shares it. What comes after it is gone waits for the
-- next tick, without a fault of its own; core.* always runs.
function K.tick_begin()
  tick_open = true
  tick_spent = 0
  tick_skipped = 0
end

-- How many calls were not made.
function K.tick_end()
  tick_open = false
  return tick_skipped
end

-- For the tests: every pattern above this cost runs in the Lua matcher.
function K.native_pattern(limit) NATIVE_PATTERN = limit end

-- After an error that came out of `guarded` itself (no memory left even in its own frame): how many calls are still open.
function K.unwind(open)
  sethook()
  depth = open
  if open == 0 then
    spent = 0
    exempt = false
  end
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

function K.run_line(key, lock)
  local l = lines[key]
  if not l then return nil end
  if tick_open and tick_spent > TICK_BUDGET then
    tick_skipped = tick_skipped + 1
    return nil
  end
  locked = lock == true
  local outer = exempt
  exempt = false
  local ok, r = guarded(l.f)
  exempt = outer
  locked = false
  if not ok then
    host.fault("rune:" .. key, reason(r))
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
  if not ok then return "errore: " .. reason(r) end
  return fmt(r)
end

K.reset()
return K
