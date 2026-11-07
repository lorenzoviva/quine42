-- Villager: speaks through the Narrator (persona in the manifest). Here only what happens at birth.
local M = {}

function M.on_spawn(id)
  local w = ecs.get(id, "wander")
  if w then w.speed = 0.8 + hash(id, 5) * 0.8 end
end

return M
