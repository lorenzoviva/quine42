-- Bacheca delle corporazioni: gli avvisi cambiano col giorno; chi cerca lavoro trova da fare (e una paga).
local M = {}

local AVVISI = {
  "GILDA DEI CALDAISTI: lunedì riunione nel vicolo. Dieci ore, due valvole. Chi è con noi porti il carbone.",
  "CASA RAMELLI: cercasi colatori esperti per il turno di notte. Paga doppia, nessuna domanda.",
  "COMPAGNIA DELLA FERROVIA SOSPESA: chi trova i ladri di rame dei cavi avrà un anno di biglietti gratis.",
  "BOTTEGA VITTI: taratura dei manometri, un soldo l'uno. Quelli della fonderia nuova, due.",
  "TORRE D'ORMEGGIO: la Rondine cerca un tubo di rame e un mozzo che non abbia paura del fuoco.",
  "MINIERE DI SOLFARA: vietato scendere oltre il cunicolo sedici, per ordine del caposquadra Sbarra.",
  "LA PESA GRANDE: oricalco in calo per la terza settimana. Ciok Ciok dice che risale. Ciok Ciok dice tante cose.",
}

local LAVORI = {
  { "item.carbone", 2, "Porti due sacchi di carbone alle caldaie del vicolo: il caldaista ti paga in carbone." },
  { "item.soldo-rame", 3, "Aiuti a scaricare un carro di lingotti al porto: tre soldi di rame." },
  { "item.pane-nero", 1, "Spazzi la pensilina dello scalo: il capostazione ti dà un pane nero." },
}

local function giorno() return math.floor(time / 600) end

function M.on_interact(id, user)
  return M.on_act(id, user, "leggi")
end

function M.on_act(id, user, action)
  local b = ecs.get(id, "bacheca")
  if not b then return "La bacheca è vuota." end
  if action == "leggi" then
    b.letti = (b.letti or 0) + 1
    local i = (giorno() + b.letti + math.floor(hash(id, 3) * #AVVISI)) % #AVVISI + 1
    return AVVISI[i]
  elseif action == "lavoro" then
    if (b.lavoro or -1) == giorno() then return "Per oggi gli avvisi di lavoro sono già stati presi. Torna domani." end
    b.lavoro = giorno()
    local l = LAVORI[math.floor(hash(id, giorno()) * #LAVORI) + 1]
    inventory.add(user, l[1], l[2])
    return l[3]
  elseif action == "affiggi" then
    inventory.remove(user, "item.capsula-pneumatica", 1)
    b.affissi = (b.affissi or 0) + 1
    return "Appendi il foglio che c'era nella capsula. Domani qualcuno lo leggerà ad alta voce, come si usa: pesare in piazza."
  end
  return M.on_interact(id, user)
end

return M
