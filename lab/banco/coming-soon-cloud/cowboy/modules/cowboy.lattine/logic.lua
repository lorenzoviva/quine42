-- Lattine sulla staccionata: cinque lattine; ogni colpo ne butta giù una, se la mira (il seme del colpo) è buona.
local M = {}

local function fila(id) return ecs.get(id, "lattine") or { in_piedi = 5, colpi = 0 } end

function M.on_act(id, user, action)
  local l = fila(id)
  local testo
  if action == "tira" then
    if l.in_piedi <= 0 then return "Sulla staccionata non c'è più niente da colpire." end
    inventory.remove(user, "item.cartuccia", 1)
    l.colpi = l.colpi + 1
    if hash(id, l.colpi) < 0.55 then
      l.in_piedi = l.in_piedi - 1
      testo = "Clang! Una lattina vola via e rotola nella polvere. Ne restano " .. l.in_piedi .. "."
    else
      testo = "Il colpo alza uno sbuffo di polvere dietro la staccionata. Le lattine restano lì, beffarde."
    end
    if l.in_piedi == 0 then testo = testo .. " Tutte giù: tocca a te offrire da bere." end
  elseif action == "rimetti" then
    l.in_piedi = 5
    testo = "Rimetti in fila le cinque lattine, ammaccate ma dritte."
  elseif action == "conta" then
    return "Sulla staccionata ci sono " .. l.in_piedi .. " lattine in piedi."
  else
    return nil
  end
  ecs.set(id, "lattine", l)
  return testo
end

return M
