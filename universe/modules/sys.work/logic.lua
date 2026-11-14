-- Work (T245b): the day of whoever has a trade, task by task.
-- The kernel sets the `job` component at every phase of the day: the tasks of the phase and the places (home, square, work).
-- Here every behaviour is a function (id, task, state, trade, pos, dt) that says "done", "ongoing" or "failed:<reason>".
-- The state of the current task is in the `work` component; what one carries in `load`.
-- Walking is done by sys.wander: here only the next point of the way is chosen (`goal`).
local M = {}

local ARRIVATO = 1.3
local VICINO_SOLIDO = 1.7

-- Still, doing what it does (the pose is drawn by the renderer).
local function ferma(id, posa)
  ecs.set(id, "activity", { kind = posa or "work", still = true })
  -- Still because it works, not because it is stuck: the walking count starts over.
  local s = ecs.get(id, "work")
  if s then s.px, s.py, s.dal = nil, nil, nil end
end

-- Whoever has not moved for a while: near the goal it has arrived (a wall of a shape, which the way over tiles does not see, keeps it
-- one step away); far away it is stuck, and the task fails with the reason.
local VICINO_FERMO = 3
local FERMO = 2
local BLOCCATO = 8

local function fermo(id, p, d)
  local s = ecs.get(id, "work")
  if not s then return false end
  if not s.px or math.abs(p.x - s.px) + math.abs(p.y - s.py) >= 0.05 then
    s.px, s.py, s.dal = p.x, p.y, time
  end
  local da = time - (s.dal or time)
  if da >= BLOCCATO then s.bloccato = true end
  return d < VICINO_FERMO and da >= FERMO
end

-- How far a way is looked for (world.path looks no farther): beyond, one walks straight.
local MAX_WAY = 60

-- A step towards (tx, ty): the goal of sys.wander is the next point of the way. True if it has arrived.
-- T299: the way is for a body as large as this one; with no way (nor one near the goal) nobody pushes at the wall: the task fails at
-- once, and the day goes on with the next one.
local function cammina(id, p, tx, ty, solido)
  local dx, dy = tx - p.x, ty - p.y
  local d = math.sqrt(dx * dx + dy * dy)
  if d < (solido and VICINO_SOLIDO or ARRIVATO) or fermo(id, p, d) then return true end
  local b = ecs.get(id, "body")
  local q = world.path(p.x, p.y, tx, ty, b and b.r)
  if not q then
    if d <= MAX_WAY then
      local s = ecs.get(id, "work")
      if s then s.no_way = true end
    end
    q = { x = tx, y = ty }
  end
  ecs.set(id, "goal", { x = q.x, y = q.y })
  ecs.set(id, "activity", { kind = "stroll", still = false })
  return false
end

-- Where: home, work, square (from the kernel), venture (the building site), tile:<code> (the nearest one).
local function posto(m, p, dove)
  if dove == "home" or dove == "work" or dove == "square" then return m[dove] end
  if dove == "venture" then return m.venture_spot end
  local codice = type(dove) == "string" and dove:match("^tile:(.+)$")
  if codice then
    local c = m.work or p
    return world.find_tile(codice, c.x, c.y, 12)
  end
  return nil
end

local function carica(id, oggetto, n)
  local c = ecs.get(id, "load") or {}
  c[oggetto] = (c[oggetto] or 0) + n
  ecs.set(id, "load", c)
end

local function dice(id, compito, s)
  if compito.says and not s.detto then
    world.speak(id, compito.says)
    s.detto = true
  end
end

local B = {}

function B.go(id, compito, s, m, p)
  local t = posto(m, p, compito.where)
  if not t then return "failed:no_place:" .. tostring(compito.where) end
  if cammina(id, p, t.x, t.y) then return "done" end
  return "ongoing"
end

-- A tile `from` near the work becomes `to` after `duration` of work, `count` times. What is left to do is the world itself.
local function cambia(id, compito, s, m, p, da, a, raccolto)
  if not s.x then
    local c = m.work or p
    local t = world.find_tile(da, c.x, c.y, 8)
    if not t then
      -- Nothing to do here: the task is done for today.
      return "done"
    end
    s.x, s.y = t.x, t.y
  end
  if world.tile(s.x, s.y) ~= da then
    s.x, s.y, s.expires = nil, nil, nil
    return "ongoing"
  end
  local solido = world.free(s.x, s.y, 0.3) == false
  if not s.expires then
    if not cammina(id, p, s.x, s.y, solido) then return "ongoing" end
    s.expires = time + (compito.duration or 10)
    dice(id, compito, s)
  end
  ferma(id, compito.pose)
  if time < s.expires then return "ongoing" end
  world.set_tile(s.x, s.y, a)
  if raccolto then carica(id, raccolto, 1) end
  s.fatti = (s.fatti or 0) + 1
  s.x, s.y, s.expires = nil, nil, nil
  if s.fatti >= (compito.count or 1) then return "done" end
  return "ongoing"
end

function B.transform(id, compito, s, m, p)
  return cambia(id, compito, s, m, p, compito.from, compito.to)
end

function B.gather(id, compito, s, m, p)
  return cambia(id, compito, s, m, p, compito.tile, compito.drop or compito.tile, compito.item)
end

-- Still, in the pose: with no duration, until the end of the phase.
local function resta(posa)
  return function(id, compito, s)
    ferma(id, compito.pose or posa)
    dice(id, compito, s)
    if not compito.duration then return "ongoing" end
    s.expires = s.expires or (time + compito.duration)
    if time < s.expires then return "ongoing" end
    return "done"
  end
end
B.rest = resta("sleep")
B.eat = resta("eat")
B.pray = resta("pray")
B.chat = resta("chat")
B.wait = resta("work")

function B.patrol(id, compito, s, m, p)
  local giro = compito.route or {}
  if #giro == 0 then return "done" end
  s.tappa = s.tappa or 1
  local t = posto(m, p, giro[s.tappa])
  if not t or cammina(id, p, t.x, t.y) then s.tappa = s.tappa % #giro + 1 end
  return "ongoing"
end

-- The store of the place (T245c): what the trades bring and take, in this module's store, one key per place.
local function deposito_di(id)
  local m = ecs.get(id, "job")
  if not m or type(m.chunk) ~= "string" then return nil end
  return "deposit:" .. m.chunk:gsub(",", ":")
end

local function deposita(id, oggetto, n)
  local k = deposito_di(id)
  if not k or n <= 0 then return false end
  local d = world.store_get(k) or {}
  d[oggetto] = (d[oggetto] or 0) + n
  return world.store_set(k, d)
end

-- Takes up to n from the store, and says how many.
local function preleva(id, oggetto, n)
  local k = deposito_di(id)
  if not k then return 0 end
  local d = world.store_get(k) or {}
  local preso = math.min(n, d[oggetto] or 0)
  if preso <= 0 then return 0 end
  d[oggetto] = d[oggetto] - preso
  if d[oggetto] <= 0 then d[oggetto] = nil end
  world.store_set(k, d)
  return preso
end

local function scarica(id, oggetto, n)
  local c = ecs.get(id, "load") or {}
  local tolto = math.min(n, c[oggetto] or 0)
  c[oggetto] = (c[oggetto] or 0) - tolto
  if c[oggetto] <= 0 then c[oggetto] = nil end
  ecs.set(id, "load", c)
  return tolto
end

-- Before every thing to do, the place: by default the work.
local function al_posto(id, compito, s, m, p)
  if s.arrivato then return true end
  local dove = compito.where or "work"
  local t
  local tag = type(dove) == "string" and dove:match("^entity:(.+)$")
  if tag then
    local e = world.nearest(p.x, p.y, 12, tag)
    if e then
      s.cosa = e
      t = ecs.get(e, "pos")
    end
  else
    t = posto(m, p, dove)
  end
  if not t then return nil end
  if cammina(id, p, t.x, t.y, tag ~= nil) then
    s.arrivato = true
    return true
  end
  return false
end

-- Brings what it has to the store of the place (or into the thing, if it has a pocket): all at once.
function B.carry(id, compito, s, m, p)
  local c = ecs.get(id, "load") or {}
  if (c[compito.item] or 0) <= 0 then return "done" end
  local qui = al_posto(id, compito, s, m, p)
  if qui == nil then return "failed:no_place" end
  if not qui then return "ongoing" end
  local n = c[compito.item]
  if s.cosa and inventory.add(s.cosa, compito.item, n) > 0 then
    scarica(id, compito.item, n)
  elseif deposita(id, compito.item, n) then
    scarica(id, compito.item, n)
  else
    return "failed:deposit_full"
  end
  ferma(id, compito.pose or "work")
  dice(id, compito, s)
  return "done"
end

-- Takes from the store of the place.
function B.take(id, compito, s, m, p)
  local qui = al_posto(id, compito, s, m, p)
  if qui == nil then return "failed:no_place" end
  if not qui then return "ongoing" end
  local n = preleva(id, compito.item, compito.count or 1)
  if n <= 0 then return "failed:missing:" .. compito.item end
  carica(id, compito.item, n)
  dice(id, compito, s)
  return "done"
end

-- At the bench (the place), with what is needed (`with`: from what it carries, or from the store), after `duration` of work: one more thing.
function B.produce(id, compito, s, m, p)
  local qui = al_posto(id, compito, s, m, p)
  if qui == nil then return "failed:no_place" end
  if not qui then return "ongoing" end
  if not s.expires then
    if compito.with and scarica(id, compito.with, 1) < 1 and preleva(id, compito.with, 1) < 1 then
      if (s.fatti or 0) > 0 then return "done" end
      return "failed:missing:" .. compito.with
    end
    s.expires = time + (compito.duration or 10)
    dice(id, compito, s)
  end
  ferma(id, compito.pose or "work")
  if time < s.expires then return "ongoing" end
  carica(id, compito.item, 1)
  s.fatti = (s.fatti or 0) + 1
  s.expires = nil
  if s.fatti >= (compito.count or 1) then return "done" end
  return "ongoing"
end

-- Uses a thing like the wanderer does with «Usa»: its on_act, with the individual as the user.
function B.use(id, compito, s, m, p)
  local qui = al_posto(id, compito, s, m, p)
  if qui == nil then return "failed:nothing_to_use" end
  if not qui then return "ongoing" end
  if not s.expires then
    s.expires = time + (compito.duration or 5)
    s.usato = world.act(id, s.cosa, compito.action) ~= nil
    dice(id, compito, s)
  end
  ferma(id, compito.pose or "work")
  if time < s.expires then return "ongoing" end
  return "done"
end

-- Building (T245d): the next step of the venture is told by the kernel (world.venture). Bringing a material (from the load, or first
-- from the store of the place, in the square), working at the building site, reaping. While there is a step the task goes on; without one, back to the trade.
-- The work is counted by the kernel by looking at who stands still at the site: no number is written here.
function B.build(id, compito, s, m, p, dt)
  local passo = world.venture(id)
  if not passo then return "done" end
  if s.passo_fa ~= passo.does or s.oggetto ~= passo.item then
    s.passo_fa, s.oggetto, s.x, s.y, s.expires, s.fatti, s.preso = passo.does, passo.item, nil, nil, nil, nil, nil
  end
  if passo.does == "carry" then
    local c = ecs.get(id, "load") or {}
    if (c[passo.item] or 0) <= 0 then
      -- To the store of the place, in the square.
      local t = m.square or p
      if not cammina(id, p, t.x, t.y) then return "ongoing" end
      local n = preleva(id, passo.item, 2)
      if n <= 0 then return "done" end
      carica(id, passo.item, n)
      return "ongoing"
    end
    if not cammina(id, p, passo.x, passo.y, true) then return "ongoing" end
    if world.venture_bring(id, passo.item) <= 0 then return "done" end
    dice(id, compito, s)
    return "ongoing"
  end
  if passo.does == "gather" then
    local esito = cambia(id, passo, s, { work = { x = passo.x, y = passo.y } }, p, passo.tile, passo.drop, passo.item)
    if esito == "done" and (s.fatti or 0) == 0 then return "done" end
    if esito == "done" then s.fatti = 0 end
    return "ongoing"
  end
  -- Working: at one's own spot around the building site, still in the pose.
  if not s.expires then
    if not cammina(id, p, passo.x, passo.y) then return "ongoing" end
    s.expires = true
  end
  ferma(id, passo.pose or "work")
  dice(id, compito, s)
  return "ongoing"
end

-- The panel of the building site (T245d): the button brings what is needed from the wanderer's bag, if it is near the site.
function M.on_ui(user, azione)
  if azione ~= "bring" then return nil end
  local n = world.venture_bring(user)
  if n > 0 then return "Lasci al cantiere " .. n .. " cose che servivano." end
  return "Al cantiere qui vicino non serve niente di ciò che porti (o sei troppo lontano)."
end

M.comportamenti = B

function M.update(dt)
  ecs.each("job, pos", function(id, m, p)
    local mind = ecs.get(id, "mind")
    if mind and mind.mode ~= "wander" then return end
    local s = ecs.get(id, "work")
    if not s or s.phase ~= m.phase or s.day ~= m.day or s.venture ~= m.venture then
      ecs.set(id, "work", { phase = m.phase, day = m.day, venture = m.venture, step = 1 })
      -- ecs.set copies: what the task writes goes into the component's table, the one that is read again.
      s = ecs.get(id, "work")
    end
    local compito = m.tasks and m.tasks[s.step]
    if not compito then
      ferma(id, "chat")
      return
    end
    local f = B[compito.does]
    local esito = f and f(id, compito, s, m, p, dt) or "failed:unknown_behaviour"
    if esito == "ongoing" and s.no_way then esito = "failed:no_way" end
    if esito == "ongoing" and s.bloccato then esito = "failed:unreachable" end
    if esito ~= "ongoing" then
      -- The next task starts from scratch: of the state only where one got to in the day remains, and the last reason.
      ecs.set(id, "work", { phase = s.phase, day = s.day, venture = s.venture, step = s.step + 1, reason = esito ~= "done" and esito or s.reason })
    end
  end)
end

return M
