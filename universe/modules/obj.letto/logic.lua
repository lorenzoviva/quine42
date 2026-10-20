-- Letto: dormire ristora; sotto il letto, a volte, qualcosa di dimenticato.
-- Lo stato ("già frugato") vive nel componente "frugato" dell'entità.
local M = {}

function M.on_act(id, user, action)
  if action == "dormi" then
    local n = ecs.get(user, "needs")
    if n then n.energy = 100 end
    return "Dormi un sonno senza sogni. Al risveglio il mondo è identico, fin troppo."
  end
  if action == "fruga" then
    if ecs.get(id, "frugato") then return "Solo polvere." end
    ecs.set(id, "frugato", { si = true })
    if hash(id, 9) < 0.5 then
      local coin = items.find("Moneta di rame")
      if coin then inventory.add(user, coin, 1 + math.floor(hash(id, 4) * 3)) end
      return "Trovi qualche moneta impolverata."
    end
    return "Niente, a parte un calzino spaiato."
  end
end

return M
