-- Vagabondaggio: ogni tanto si sceglie una direzione nuova, o ci si ferma a guardare.
-- Lo stato (direzione, timer) vive nel componente wander. Chi ha una mente (mind) vaga solo se
-- ha deciso di farlo: "segui" e "resta" sono affare di sys.follow.
-- Chi ha una meta (componente meta {x, y}, scelta dal kernel secondo la sua giornata: casa, lavoro,
-- piazza) ci cammina; arrivato, gironzola lì vicino.
local M = {}

local function verso(id, w, p, b, meta, dt)
  local dx, dy = meta.x - p.x, meta.y - p.y
  local d = math.sqrt(dx * dx + dy * dy)
  if d < 1.2 then return false end
  local v = (w.speed + 0.4) * world.speed_at(p.x, p.y) * dt
  local ux, uy = dx / d, dy / d
  local moved = false
  if world.free(p.x + ux * v, p.y, b.r) then p.x = p.x + ux * v moved = true end
  if world.free(p.x, p.y + uy * v, b.r) then p.y = p.y + uy * v moved = true end
  if not moved then
    -- Ostacolo: si scansa di lato per un po'.
    w.sx, w.sy, w.scansa = -uy, ux, 0.8
    if hash(id, math.floor(time), 5) < 0.5 then w.sx, w.sy = uy, -ux end
  end
  return true
end

function M.update(dt)
  local tick = math.floor(time * 10)
  ecs.each("wander, pos, body", function(id, w, p, b)
    local mind = ecs.get(id, "mind")
    if mind and mind.mode ~= "vaga" then return end
    -- Arrivato, fa quello che deve: dorme nel letto, zappa il campo, pesca sulla riva. Fermo.
    local att = ecs.get(id, "attivita")
    if att and att.ferma then return end
    local meta = ecs.get(id, "meta")
    if meta and meta.x then
      if (w.scansa or 0) > 0 then
        w.scansa = w.scansa - dt
        local v = w.speed * dt
        if world.free(p.x + w.sx * v, p.y + w.sy * v, b.r) then p.x, p.y = p.x + w.sx * v, p.y + w.sy * v else w.scansa = 0 end
        return
      end
      if verso(id, w, p, b, meta, dt) then return end
    end
    local t, dx, dy = w.t - dt, w.dx, w.dy
    if t <= 0 then
      if hash(id, tick, 3) < 0.4 then
        dx, dy = 0, 0
      else
        local a = hash(id, tick, 7) * math.pi * 2
        dx, dy = math.cos(a), math.sin(a)
      end
      w.dx, w.dy = dx, dy
      t = 1 + hash(id, tick, 11) * 3
      -- Vicino alla meta si resta vicino: pause più lunghe, passi brevi.
      if meta and meta.x then t = t * 0.5 end
    end
    w.t = t
    if dx == 0 and dy == 0 then return end
    local v = w.speed * world.speed_at(p.x, p.y) * dt
    local nx, ny = p.x + dx * v, p.y + dy * v
    if world.free(nx, ny, b.r) then
      p.x, p.y = nx, ny
    else
      w.t = 0
    end
  end)
end

return M
