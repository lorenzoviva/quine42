-- The carpet.
-- Every step of the player is offset by an opposite slide:
-- the world moves, the player stays at the centre. Forever.
local M = {}

function M.update(dt)
  if not carpet.active then return end
  local k = carpet.strength * math.min(1, carpet.rate * dt)
  ecs.each("player, pos", function(id, _, p)
    local sx, sy = p.x * k, p.y * k
    p.x, p.y = p.x - sx, p.y - sy
    carpet.ox, carpet.oy = carpet.ox + sx, carpet.oy + sy
  end)
end

return M
