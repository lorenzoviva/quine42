-- Vagabondaggio: ogni tanto si sceglie una direzione nuova, o ci si ferma a guardare.
-- Lo stato (direzione, timer) vive nel componente wander, non qui.
local M = {}

function M.update(dt)
  local tick = math.floor(time * 10)
  ecs.each("wander, pos, body", function(id, w, p, b)
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
    end
    w.t = t
    if dx == 0 and dy == 0 then return end
    local v = w.speed * dt
    local nx, ny = p.x + dx * v, p.y + dy * v
    if world.free(nx, ny, b.r) then
      p.x, p.y = nx, ny
    else
      w.t = 0
    end
  end)
end

return M
