-- Rovo: le more si raccolgono una volta; tagliato (con uno strumento "taglio") lascia legna.
local M = {}

function M.on_act(id, user, action)
  if action ~= "raccogli" then return nil end
  local state = ecs.get(id, "raccolto")
  if state then return "Le more sono finite. Ricresceranno quando il mondo si ripete." end
  ecs.set(id, "raccolto", { si = true })
  local more = items.find("Bacche di rovo")
  if more then inventory.add(user, more, 3 + math.floor(hash(id, 2) * 4)) end
  return "Ti graffi le dita, ma raccogli una manciata di more."
end

return M
