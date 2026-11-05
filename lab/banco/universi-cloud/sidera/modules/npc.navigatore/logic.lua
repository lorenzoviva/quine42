-- Navigatore della Gilda: rotte, avamposti, e chi mostra una carta delle rotte guadagna fiducia (e un gettone della cabina).
local M = {}

local AVAMPOSTI = {
  "Brina di Calisto: ghiaccio fino all'orizzonte, cupole piccole come uova, gente che parla poco e ride forte.",
  "Pozzo Ardente: una miniera dentro un vulcano spento. Si lavora di notte, di giorno la roccia brucia le suole.",
  "Orlo Nero: la stazione mineraria più lontana. Ci si arriva in venti giorni, e si torna con le tasche piene o non si torna.",
}

local function d(id)
  local v = ecs.get(id, "dialogo")
  if not v then v = { fase = 0, fiducia = 0 }; ecs.set(id, "dialogo", v) end
  return v
end

function M.on_act(id, user, action)
  local v = d(id)
  if action == "rotte" then
    v.fase = v.fase + 1
    local st = ecs.get(user, "stati")
    if st and st["in rotazione"] then return "Ride. «Giri come una navetta in avaria. Fermati, o ti traccio una rotta di ritorno.»" end
    if v.fase == 1 then return "«Tre rotte, tre avamposti. La quarta, quella che nessuno ha percorso, la tengono nelle carte della Gilda, sotto chiave.»" end
    return "«Una rotta è come una ricetta: l'ordine conta. Prima la spinta, poi la curva, poi la pazienza.»"
  end
  if action == "avamposti" then
    local i = (v.fase % #AVAMPOSTI) + 1
    v.fase = v.fase + 1
    return "«" .. AVAMPOSTI[i] .. "»"
  end
  if action == "carta" then
    if v.fiducia >= 3 then return "«La conosco bene, la tua carta: guarda, quella rotta l'ho segnata io. Tienila stretta.»" end
    v.fiducia = v.fiducia + 3
    local g = items.find("Gettone della cabina")
    if g then inventory.add(user, g, 1) end
    return "Studia la carta a lungo, sfiorando le rotte col dito. «Chi ti ha dato questa sa il fatto suo. Prendi: un gettone della cabina. Un giorno vedrai l'Anello da vicino.»"
  end
end

return M
