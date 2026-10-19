-- Abitante: il dialogo arriva dal gateway IA (interaction "talk").
-- Qui solo ciò che succede alla nascita.
local M = {}

function M.on_spawn(id)
  local w = ecs.get(id, "wander")
  if w then w.speed = 0.8 + hash(id, 5) * 0.8 end
end

return M
