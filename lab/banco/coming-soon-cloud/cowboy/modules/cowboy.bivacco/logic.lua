-- Fuoco del bivacco: fa luce davvero (il componente luce) e scalda il caffè solo se è acceso.
local M = {}

local function luce(id) return ecs.get(id, "luce") or { raggio = 4, accesa = false, colore = "#ff9a4a" } end

function M.on_act(id, user, action)
  local l = luce(id)
  if action == "accendi" then
    if l.accesa then return "Il fuoco scoppietta già." end
    ecs.set(id, "luce", { raggio = 4, accesa = true, colore = "#ff9a4a" })
    return "Soffi sulla brace e aggiungi due rami secchi: la fiamma si alza."
  elseif action == "spegni" then
    if not l.accesa then return "Il fuoco è già spento: resta solo un filo di fumo." end
    ecs.set(id, "luce", { raggio = 4, accesa = false, colore = "#ff9a4a" })
    return "Butti una manciata di terra sul fuoco. Sulla frontiera un fuoco non si lascia mai acceso."
  elseif action == "caffe" then
    if not l.accesa then return "Sul fuoco spento il bricco resta freddo." end
    inventory.remove(user, "item.chicchi-caffe", 1)
    inventory.add(user, "item.caffe", 1)
    return "Il caffè bolle nel bricco annerito. Ne versi una tazza: nero, forte, perfetto."
  end
  return nil
end

return M
