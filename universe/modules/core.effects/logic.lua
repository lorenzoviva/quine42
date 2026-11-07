-- Effects: the Council picks from a closed set, the kernel validates them, here they happen.
-- apply(target, who, effect, x, y) returns a sentence (or nil). x, y: where it happens, if there is no target.
-- Effects have English names and fields (contract 0.2): { type = "light", radius = 4, duration = 60 }.
local M = {}

local NEEDS = { "hunger", "thirst", "energy", "health" }

local function clamp(v) return math.max(0, math.min(100, v)) end

local function where(target, x, y)
  local p = target and ecs.get(target, "pos")
  if p then return p.x, p.y end
  if x and y then return x, y end
  local pp = world.player_pos()
  return pp.x, pp.y
end

local F = {}

function F.message(_, _, e) return e.text end

function F.needs(_, user, e)
  local n = ecs.get(user, "needs")
  if not n then return nil end
  for _, k in ipairs(NEEDS) do
    if e[k] then n[k] = clamp(n[k] + e[k]) end
  end
  return nil
end

function F.create_item(target, _, e, x, y)
  local px, py = where(target, x, y)
  for i = 1, (e.quantity or 1) do
    world.spawn(e.item, px + (hash(i, 7) - 0.5) * 0.8, py + 0.4 + (hash(i, 9) - 0.5) * 0.4)
  end
  local d = items.def(e.item)
  return d and ("Compare: " .. d.name .. ".") or nil
end

function F.consume(_, user, e)
  inventory.remove(user, e.item, e.quantity or 1)
  return nil
end

function F.destroy(target)
  if target then world.break_entity(target) end
  return nil
end

function F.open(target)
  if target and world.open(target) then return nil end
  return "Non c'è niente da aprire."
end

function F.container(target, _, e)
  if target then world.make_container(target, e.capacity or 6, e.loot or "cassa") end
  return nil
end

function F.terrain(target, _, e, x, y)
  local px, py = where(target, x, y)
  local cx, cy = math.floor(px), math.floor(py)
  local r = e.radius or 1
  for dy = -r, r do
    for dx = -r, r do
      if dx * dx + dy * dy <= r * r + r then
        if not e.from or world.tile(cx + dx, cy + dy) == e.from then world.set_tile(cx + dx, cy + dy, e.to) end
      end
    end
  end
  return nil
end

function F.fire(target, _, e, x, y)
  local px, py = where(target, x, y)
  local r = e.radius or 1
  ecs.spawn({
    pos = { x = px, y = py },
    glyph = { ch = "✶", color = "#ff8a2a", scale = 0.9 },
    fire = { radius = r },
    light = { radius = r * 2 + 2, color = "#ffb060", lit = true },
    ephemeral = { expires = time + (e.duration or 10) },
  })
  return nil
end

function F.light(target, _, e, x, y)
  local px, py = where(target, x, y)
  ecs.spawn({
    pos = { x = px, y = py },
    glyph = { ch = "✧", color = "#fff3b0", scale = 0.6 },
    light = { radius = e.radius or 4, color = "#fff3b0", lit = true },
    ephemeral = { expires = time + (e.duration or 60) },
  })
  return nil
end

function F.shield(_, user, e)
  ecs.set(user, "shield", { expires = time + (e.duration or 20) })
  return nil
end

function F.push(target, user, e)
  local p = target and ecs.get(target, "pos")
  local b = target and ecs.get(target, "body")
  if not p then return nil end
  local u = world.player_pos()
  local dx, dy = p.x - u.x, p.y - u.y
  local d = math.sqrt(dx * dx + dy * dy)
  if d < 0.01 then dx, dy, d = 0, 1, 1 end
  local r = (b and b.r) or 0.3
  local steps = math.floor((e.force or 3) * 4)
  for _ = 1, steps do
    local nx, ny = p.x + dx / d * 0.25, p.y + dy / d * 0.25
    if not world.free(nx, ny, r, p.z) then break end
    p.x, p.y = nx, ny
  end
  return nil
end

-- A state of the wanderer: on horseback, in a boat, with the backpack. It changes speed, weight, light.
function F.state(_, user, e)
  local st = ecs.get(user, "states") or {}
  st[e.name] = { speed = e.speed or 1, weight = e.weight or 0, light = e.light or 0, expires = (e.duration or 0) > 0 and (time + e.duration) or 0 }
  ecs.set(user, "states", st)
  return nil
end

function F.remove_state(_, user, e)
  -- The state goes out (false); the kernel then removes it from the table.
  local st = ecs.get(user, "states")
  if st then st[e.name] = false end
  return nil
end

function F.summon(target, _, e, x, y)
  local px, py = where(target, x, y)
  world.spawn(e.module, px + 0.8, py + 0.3)
  return nil
end

-- Whether an effect has someone applying it: the kernel asks before applying it, and an effect without one is a fault (T260).
function M.handles(type)
  return F[type] ~= nil
end

function M.apply(target, user, e, x, y)
  local f = F[e.type]
  if not f then return nil end
  return f(target, user, e, x, y)
end

return M
