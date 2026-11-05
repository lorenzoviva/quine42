-- Scudo deflettore: una cella dà tre accensioni; acceso fa luce viola (il componente luce) finché qualcuno non lo spegne.
local M = {}

function M.on_act(id, user, action)
  local g = ecs.get(id, "scudo") or { carica = 0, acceso = false }
  local testo
  if action == "carica" then
    if g.carica >= 3 then return "Il generatore è già carico: la spia è verde." end
    inventory.remove(user, "item.cella-energia", 1)
    g.carica = 3
    testo = "La cella scatta in sede. Il generatore comincia a ronzare."
  elseif action == "accendi" then
    if g.acceso then return "Lo scudo è già acceso: l'aria sopra la sfera trema." end
    if g.carica <= 0 then return "La spia è rossa: senza una cella lo scudo non si accende." end
    g.carica = g.carica - 1
    g.acceso = true
    ecs.set(id, "luce", { raggio = 6, accesa = true, colore = "#a08aff" })
    testo = "Una cupola viola si gonfia attorno al generatore. Un sasso piccolo ci rimbalza sopra."
  elseif action == "spegni" then
    if not g.acceso then return "Lo scudo è già spento." end
    g.acceso = false
    ecs.set(id, "luce", { raggio = 6, accesa = false, colore = "#a08aff" })
    testo = "La cupola si sgonfia con un sospiro."
  else
    return nil
  end
  ecs.set(id, "scudo", g)
  return testo
end

return M
