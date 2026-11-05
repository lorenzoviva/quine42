-- Gatto di fabbrica: fusa contate nel componente; con la salsiccia ti segue (mind.mode = "segui", sys.follow).
local M = {}

function M.on_spawn(id)
  local w = ecs.get(id, "wander")
  if w then w.speed = 2 + hash(id, 7) * 0.8 end
end

function M.on_act(id, user, action)
  local f = ecs.get(id, "fusa")
  if not f then
    ecs.set(id, "fusa", { carezze = 0 })
    f = ecs.get(id, "fusa")
  end
  if action == "accarezza" then
    f.carezze = (f.carezze or 0) + 1
    local st = ecs.get(user, "stati")
    if st and st["nel vapore"] then return "(il gatto si strofina contro le tue gambe tiepide di vapore e fa le fusa forte, come una caldaia contenta)" end
    if f.carezze > 3 then return "(il gatto si rotola sulla schiena e ti mostra la pancia sporca di fuliggine) Rrrrr." end
    return "(il gatto chiude gli occhi e fa le fusa) Rrrr."
  elseif action == "salsiccia" then
    inventory.remove(user, "item.salsiccia", 1)
    local m = ecs.get(id, "mind")
    if m then m.mode = "segui" end
    return "(il gatto mangia la salsiccia in tre morsi, poi si mette a trotterellare dietro di te) Miao."
  end
  return "(il gatto ti guarda, sbadiglia e si lecca una zampa)"
end

return M
