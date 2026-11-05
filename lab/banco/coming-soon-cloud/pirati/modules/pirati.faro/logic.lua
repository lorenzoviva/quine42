-- Lanterna del faro: l'olio la accende e lei fa luce davvero (il componente luce), finché qualcuno non la spegne.
local M = {}

function M.on_act(id, user, action)
  local l = ecs.get(id, "luce") or { raggio = 7, accesa = false, colore = "#ffd27a" }
  if action == "accendi" then
    if l.accesa then return "La lanterna arde già: il vetro è caldo." end
    inventory.remove(user, "item.olio-lampada", 1)
    ecs.set(id, "luce", { raggio = 7, accesa = true, colore = "#ffd27a" })
    return "Versi l'olio e accendi lo stoppino: un fascio giallo si allunga sul mare."
  elseif action == "spegni" then
    if not l.accesa then return "La lanterna è già spenta." end
    ecs.set(id, "luce", { raggio = 7, accesa = false, colore = "#ffd27a" })
    return "Abbassi lo stoppino: il mare torna scuro."
  elseif action == "guarda" then
    if l.accesa then return "Nel fascio di luce si vede una vela lontana che corregge la rotta." end
    return "Il mare è scuro e calmo. Senza lanterna, nessuno ti vede da laggiù."
  end
  return nil
end

return M
