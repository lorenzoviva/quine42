-- Bramble: the blackberries are picked once; cut (with a "cutting" tool) it leaves wood.
local M = {}

function M.on_act(id, user, action)
  if action ~= "gather" then return nil end
  local state = ecs.get(id, "harvested")
  if state then return "Le more sono finite. Ricresceranno quando il mondo si ripete." end
  ecs.set(id, "harvested", { yes = true })
  local more = items.find("Bacche di rovo")
  if more then inventory.add(user, more, 3 + math.floor(hash(id, 2) * 4)) end
  return "Ti graffi le dita, ma raccogli una manciata di more."
end

return M
