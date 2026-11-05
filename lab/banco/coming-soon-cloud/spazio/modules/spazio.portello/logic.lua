-- Portello del relitto: non si apre finché non c'è aria dall'altra parte; aperto, la stiva diventa un contenitore.
local M = {}

function M.on_act(id, user, action)
  local p = ecs.get(id, "portello") or { aria = false, aperto = false }
  if action == "ascolta" then
    if p.aperto then return "Dalla stiva aperta arriva solo un soffio d'aria vecchia." end
    if p.aria then return "Dietro il portello senti l'aria che sibila: la spia è verde." end
    return "Dietro il portello non si sente niente. Nemmeno l'aria."
  elseif action == "pressurizza" then
    if p.aria then return "La camera è già piena d'aria." end
    inventory.remove(user, "item.bombola-ossigeno", 1)
    inventory.add(user, "item.bombola-vuota", 1)
    p.aria = true
    ecs.set(id, "portello", p)
    return "Colleghi la bombola alla valvola: l'ago sale, la spia passa dal rosso al verde."
  elseif action == "apri" then
    if p.aperto then
      world.open(id)
      return "Il portello è già aperto."
    end
    if not p.aria then return "La ruota non gira: dall'altra parte c'è il vuoto, e la serratura lo sa." end
    p.aperto = true
    ecs.set(id, "portello", p)
    world.make_container(id, 8, "relitto")
    world.open(id)
    return "La ruota cede con un gemito. Il portello si apre su una stiva buia."
  end
  return nil
end

return M
