-- Ingegnere della fusione: rami sul turno, sulla valvola manomessa (la trama della Nonna) e su chi presta una chiave.
local M = {}

local function d(id)
  local v = ecs.get(id, "dialogo")
  if not v then v = { fase = 0, fiducia = 0, chiave = false }; ecs.set(id, "dialogo", v) end
  -- Il manifest dà un dialogo con fase e fiducia soltanto: il resto si aggiunge qui.
  if v.chiave == nil then v.chiave = false end
  return v
end

function M.on_act(id, user, action)
  local v = d(id)
  if action == "turno" then
    v.fase = v.fase + 1
    local turno = ({ "del mattino", "del pomeriggio", "di notte" })[math.floor(time / 120) % 3 + 1]
    if v.fase > 2 and inventory.count(user, "rune:quanto") > 0 then return "«Hai Scintilla in tasca, si sente dal formicolio. Non pronunciarla vicino alle canalette: il plasma non ama i lampi.»" end
    return "«Siamo nel turno " .. turno .. ". Tre turni, nessuna sosta: se ci fermiamo noi, Sidera resta al buio e al freddo.»"
  end
  if action == "valvola" then
    if v.fiducia < 2 then return "Si fa scuro in volto. «La valvola tre è affare nostro. Chi sei tu per chiedere?»" end
    if v.chiave then return "«Con la tua chiave ho visto il segno: una chiave nuova, non la nostra. Qualcuno ha toccato la Nonna apposta. Ora so chi cercare.»" end
    return "«Allentata. Da sola non si svita, una valvola così. Mi servirebbe una chiave dinamometrica buona per arrivarci: la mia ha il gioco.»"
  end
  if action == "aiuta" then
    v.fiducia = v.fiducia + 3
    v.chiave = true
    local cella = items.find("Cella energetica")
    if cella then inventory.add(user, cella, 2) end
    inventory.remove(user, items.find("Chiave dinamometrica"), 1)
    return "Prende la chiave, la soppesa, sorride per la prima volta. «Questa sì che è una chiave. Grazie: prendi due celle, e te la ridò domani.»"
  end
end

return M
