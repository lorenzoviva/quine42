-- Vasca idroponica: seminata, cresce di un grado a ogni irrigazione; al terzo si raccoglie.
local M = {}
local GRADI = { "L'acqua scorre su radici nude.", "Spuntano germogli pallidi.", "Le foglie si allargano verso la lampada.", "Le alghe sono alte e lucide: si possono raccogliere." }

function M.on_act(id, user, action)
  local v = ecs.get(id, "vasca") or { seminata = false, grado = 0 }
  if action == "semina" then
    if v.seminata then return "La vasca è già seminata." end
    inventory.remove(user, "item.semi", 1)
    v.seminata = true
    v.grado = 0
    ecs.set(id, "vasca", v)
    return "Spargi i semi sul feltro bagnato e li copri con un velo d'acqua."
  elseif action == "irriga" then
    if not v.seminata then return GRADI[1] end
    v.grado = math.min(3, v.grado + 1)
    ecs.set(id, "vasca", v)
    return GRADI[v.grado + 1]
  elseif action == "raccogli" then
    if not v.seminata or v.grado < 3 then return "È troppo presto: le piante sono ancora piccole." end
    inventory.add(user, "item.alghe", 3)
    v.seminata = false
    v.grado = 0
    ecs.set(id, "vasca", v)
    return "Tagli le alghe alla base e le leghi in mazzetti. La vasca torna vuota."
  end
  return nil
end

return M
