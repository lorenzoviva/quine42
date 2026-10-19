-- Fisica delle spinte. Quando il viandante si sovrappone a un corpo spingibile, il corpo viene
-- spostato fuori dalla sovrapposizione (di più se è leggero, di meno se è pesante) e conserva un po'
-- di slancio; poi scivola, frenato dall'attrito, e si ferma contro ciò che è solido.
local M = {}

function M.update(dt)
  local pl = world.player_pos()
  ecs.each("vel, pos, body", function(id, v, p, b)
    if not b.pushable then return end
    local dx, dy = p.x - pl.x, p.y - pl.y
    local d = math.sqrt(dx * dx + dy * dy)
    local reach = b.r + 0.3
    if d < reach and d > 0.001 then
      local give = math.min(1, 30 / math.max(1, b.mass or 1))
      local push = (reach - d) * give
      local ux, uy = dx / d, dy / d
      if world.free(p.x + ux * push, p.y, b.r) then p.x = p.x + ux * push end
      if world.free(p.x, p.y + uy * push, b.r) then p.y = p.y + uy * push end
      v.x, v.y = ux * push / dt * 0.3, uy * push / dt * 0.3
      return
    end
    if v.x == 0 and v.y == 0 then return end
    local nx, ny = p.x + v.x * dt, p.y + v.y * dt
    if world.free(nx, p.y, b.r) then p.x = nx else v.x = 0 end
    if world.free(p.x, ny, b.r) then p.y = ny else v.y = 0 end
    local keep = math.max(0, 1 - (b.friction or 0.6) * 6 * dt)
    v.x, v.y = v.x * keep, v.y * keep
    if math.abs(v.x) < 0.01 then v.x = 0 end
    if math.abs(v.y) < 0.01 then v.y = 0 end
  end)
end

return M
