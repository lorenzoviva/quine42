-- The boat: the kernel's vehicle (T439) carries who is aboard and steers with the helm (up and down push, left and right turn the bow);
-- this system is the wind: the more it blows from astern, the more power the sail gives. Aground, the kernel says so (`bumped`).
local M = {}

local function vento()
  -- The wind turns slowly with time: a function of time, with no state.
  local a = time * 0.05
  return math.cos(a), math.sin(a)
end

function M.on_ui(user, azione)
  local b = ecs.get(user, "barca") or { stato = "a terra" }
  local p = world.player_pos()
  if azione == "sali" then
    local scafo = world.nearest(p.x, p.y, 2, "barca")
    if not scafo then return "Non c'è nessuna barca qui." end
    -- The helm: the kernel gives it only to who stands on the deck, and lifts the anchor.
    if not world.vehicle_set(scafo, { helm = user }) then return "Devi essere a bordo." end
    b.scafo, b.stato = scafo, "in mare"
  elseif azione == "scendi" then
    if b.scafo then world.vehicle_set(b.scafo, { helm = false, anchored = true }) end
    b.stato = "a terra"
  end
  ecs.set(user, "barca", b)
  return nil
end

-- Every wanderer's boat (T263: `world.wanderers()`): the wind on its sail, what the kernel says of its way.
local function vela(w)
  local b = ecs.get(w.id, "barca")
  if not b or not b.scafo then return end
  local v = world.vehicle(b.scafo)
  if not v then return end
  local vx, vy = vento()
  -- The bow looks toward (sin, cos) of the heading: the wind from astern pushes the most.
  local spinta = 0.4 + 0.6 * math.max(0, math.sin(v.heading) * vx + math.cos(v.heading) * vy)
  world.vehicle_set(b.scafo, { power = spinta })
  b.vento = string.format("%.1f %.1f", vx, vy)
  if v.helm == w.id then b.stato = v.bumped and "incagliata" or "in mare" end
end

function M.update(dt)
  for _, w in ipairs(world.wanderers()) do vela(w) end
end

return M
