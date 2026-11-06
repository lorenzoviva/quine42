-- Forbici: tagliano ciò che è "tagliabile"; ciò che è tagliato lascia cadere i suoi frutti.
local M = {}

function M.on_action(user, target, item)
  if not target then return "Tagli l'aria." end
  if world.has_tag(target, "tagliabile") then
    world.break_entity(target)
    return "Zac. Qualcosa cade a terra."
  end
  return "Le lame scivolano senza effetto."
end

return M
