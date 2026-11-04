-- La barca: su acqua il timone è WASD, il vento spinge più di prua che di traverso; a riva si incaglia.
local M = {}
local VELOCITA = 3

local function vento()
  -- Il vento gira piano col tempo: una funzione del tempo, senza stato.
  local a = time * 0.05
  return math.cos(a), math.sin(a)
end

function M.on_ui(user, azione)
  local b = ecs.get(user, "barca") or { stato = "a terra" }
  local p = world.player_pos()
  if azione == "sali" then
    local scafo = world.nearest(p.x, p.y, 2, "barca")
    if not scafo then return "Non c'è nessuna barca qui." end
    b.scafo, b.stato, b.a_bordo = scafo, "in mare", true
    -- Il passo a piedi si ferma: da qui in poi muove il timone (sotto, in update).
    local st = ecs.get(user, "stati") or {}
    st.a_bordo = { velocita = 0.01, peso = 0, luce = 0, fino = 0 }
    ecs.set(user, "stati", st)
  elseif azione == "scendi" then
    b.a_bordo, b.stato = false, "a terra"
    local st = ecs.get(user, "stati")
    if st then st.a_bordo = nil end
  end
  ecs.set(user, "barca", b)
  return nil
end

function M.update(dt)
  local me = world.player()
  local b = ecs.get(me, "barca")
  if not b or not b.a_bordo then return end
  local s = ecs.get(b.scafo, "pos")
  if not s then return end
  local dx, dy = 0, 0
  if input.held("left") then dx = dx - 1 end
  if input.held("right") then dx = dx + 1 end
  if input.held("up") then dy = dy - 1 end
  if input.held("down") then dy = dy + 1 end
  local vx, vy = vento()
  local spinta = 0.4 + 0.6 * math.max(0, dx * vx + dy * vy)
  b.vento = string.format("%.1f %.1f", vx, vy)
  local nx, ny = s.x + dx * VELOCITA * spinta * dt, s.y + dy * VELOCITA * spinta * dt
  local t = world.tile(nx, ny)
  if t == "w" or t == "o" then
    s.x, s.y = nx, ny
    b.stato = "in mare"
  elseif dx ~= 0 or dy ~= 0 then
    b.stato = "incagliata"
  end
  -- Il sedile: il kernel non sa tenere un corpo su un altro (il passo non scende sotto 0,2), si rimette a ogni tick
  -- lo scarto fra dove il viandante è nel mondo e dove sta lo scafo.
  local here = world.player_pos()
  local p = ecs.get(me, "pos")
  p.x, p.y = p.x + (s.x - here.x), p.y + (s.y - here.y)
end

return M
