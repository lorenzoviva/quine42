-- Boa di segnalazione: una cella la accende e lei fa luce davvero (il componente luce), finché qualcuno non la spegne.
local M = {}

function M.on_act(id, user, action)
  local l = ecs.get(id, "luce") or { raggio = 7, accesa = false, colore = "#ff7a5a" }
  if action == "accendi" then
    if l.accesa then return "La boa lampeggia già." end
    inventory.remove(user, "item.cella-energia", 1)
    ecs.set(id, "luce", { raggio = 7, accesa = true, colore = "#ff7a5a" })
    return "La lampada in cima si accende e comincia a battere piano, rossa."
  elseif action == "spegni" then
    if not l.accesa then return "La boa è già spenta." end
    ecs.set(id, "luce", { raggio = 7, accesa = false, colore = "#ff7a5a" })
    return "Stacchi la cella: la lampada si spegne."
  elseif action == "guarda" then
    if l.accesa then return "Nella luce rossa una navetta lontana corregge la rotta e ti saluta con i fari." end
    return "La rotta è buia. Senza la boa, una navetta potrebbe passare troppo vicina alla roccia."
  end
  return nil
end

return M
