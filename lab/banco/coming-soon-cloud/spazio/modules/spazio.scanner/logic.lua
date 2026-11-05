-- Scanner stellare: cerca un relitto (un'entità col tag «relitto») entro una portata che cresce se lo si tara.
local M = {}

function M.on_act(id, user, action)
  local s = ecs.get(id, "scanner") or { portata = 8 }
  if action == "tara" then
    if s.portata >= 16 then return "Lo scanner è già alla portata massima." end
    inventory.remove(user, "item.cella-energia", 1)
    s.portata = s.portata + 4
    ecs.set(id, "scanner", s)
    return "Inserisci la cella: lo schermo si schiarisce e la portata sale a " .. s.portata .. " passi."
  elseif action == "scansiona" then
    local p = ecs.get(id, "pos")
    if not p then return "Lo schermo resta nero." end
    local r = world.nearest(p.x, p.y, s.portata, "relitto")
    if r then
      local q = ecs.get(r, "pos")
      local d = q and math.floor(math.sqrt((q.x - p.x) ^ 2 + (q.y - p.y) ^ 2)) or 0
      return "Un punto ciano lampeggia sullo schermo: un relitto a " .. d .. " passi."
    end
    return "Lo schermo gira lento e non trova niente entro " .. s.portata .. " passi."
  end
  return nil
end

return M
