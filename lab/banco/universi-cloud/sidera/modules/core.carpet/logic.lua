-- Il tappeto.
-- Ogni passo del giocatore viene compensato da uno scorrimento opposto:
-- il mondo si muove, lui resta al centro. Per sempre.
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
