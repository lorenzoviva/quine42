-- Bed: sleeping restores; under the bed, sometimes, something forgotten.
-- The state ("already searched") lives in the entity's "searched" component.
local M = {}

function M.on_act(id, user, action)
  if action == "sleep" then
    local n = ecs.get(user, "needs")
    if n then n.energy = 100 end
    return "Dormi un sonno senza sogni. Al risveglio il mondo è identico, fin troppo."
  end
  if action == "search" then
    if ecs.get(id, "searched") then return "Solo polvere." end
    ecs.set(id, "searched", { yes = true })
    if hash(id, 9) < 0.5 then
      local coin = items.find("Moneta di rame")
      if coin then inventory.add(user, coin, 1 + math.floor(hash(id, 4) * 3)) end
      return "Trovi qualche moneta impolverata."
    end
    return "Niente, a parte un calzino spaiato."
  end
end

return M
