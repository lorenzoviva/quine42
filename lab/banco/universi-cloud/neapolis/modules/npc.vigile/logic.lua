-- Vigile urbano: dialoghi a rami (saluto, quartiere, lavoro, insistere), reazioni alle rune che il viandante porta
-- e agli stati che le rune pronunciate gli lasciano addosso, uno scambio in monete. Il discorso vive nel componente
-- "discorso" dell'entità; il buio del quartiere lo dice sys.quartiere.
local M = {}

local SALUTI = {
  mattina = "Bonombo. Circolare, circolare: l’incrocio non è un salotto.",
  giorno = "Bonombo. Hai visto un motorino rosso in seconda fila? Ho la multa pronta.",
  sera = "Bonombo. Fine turno, quasi. Non farmi fare straordinari.",
  notte = "Di notte la città ha altre regole. Io no.",
}

local RAMI = {
  quartiere = {
    "Il cantiere ha più permessi che operai. Io controllo tutti, ma qualcuno mi dice di non controllare.",
    "Mi hanno detto di non guardare dentro la recinzione dopo le dieci. Io guardo lo stesso.",
    "Dal cantiere, di notte, esce un camion senza targa. Se lo fermo, perdo il posto. Se non lo fermo, perdo il sonno.",
  },
  mestiere = {
    "Una multa è una lezione con la ricevuta.",
    "Il fischietto si usa poco: quando fischi, la gente deve fermarsi davvero.",
    "Conosco ogni motorino del rione. E ogni scusa.",
  },
}

local INSISTI = {
  quartiere = "Se vuoi aiutare, porta qualcosa da quel cantiere: un documento, un pezzo, una prova. Io non posso entrare.",
  mestiere = "Studia, che i commissari si fanno coi libri, non con le multe.",
  nessuno = "Insisti? Attento che anche l’insistenza è un’infrazione.",
}

local RUNE = {
  sirena = "La runa della sirena! Me la presti per l’ora di punta?",
  asfalto = "Una runa che fa le strade dritte. Il Corso ne avrebbe bisogno.",
  nebbia = "La runa per sparire… Ecco come escono dal cantiere senza essere visti.",
  motore = "La runa del motorino: niente targa, niente multa. Ingiusto.",
}
local RUNA_ALTRA = "Una runa. Non c’è articolo del codice che le vieti. Per ora."
local RUNA_NESSUNA = "Rune? Se le metti sul marciapiede in fila, è occupazione di suolo pubblico."
local ORDINE = {
  "corrente",
  "lamiera",
  "marea",
  "asfalto",
  "caffe",
  "voce",
  "sirena",
  "pane",
  "nebbia",
  "motore",
  "sutura",
  "tufo",
  "luce",
  "fuoco",
  "terra",
  "vento",
}

local STATI = {
  nascosto = "(fischia a un motorino, poi si gira di scatto) …Chi va là? Niente.",
  allerta = "Sei sull’attenti come una recluta. Che succede?",
  carico = "Calma, calma. Un vigile nervoso basta e avanza.",
  ["di corsa"] = "Alt! Eccesso di velocità, a piedi. Per stavolta, solo un richiamo.",
}
local STATI_ORDINE = { "nascosto", "allerta", "di corsa", "carico" }

local COMPRA = {
  oggetto = "Mappa della città",
  prezzo = 2,
  quanti = 1,
  testo = "Pagata. Tieni anche questa pianta della città: così la prossima volta parcheggi dove si può.",
}

local BUIO = "Semafori spenti, lampioni spenti. Stanotte il traffico lo dirigo io, col fischietto."

-- La parte del giorno, come la conta il kernel (un giorno dura 600 secondi).
local function fase()
  local p = ((time or 0) / 600 + 0.12) % 1
  if p < 0.12 or p >= 0.96 then return "mattina" end
  if p < 0.42 then return "giorno" end
  if p < 0.58 then return "sera" end
  return "notte"
end

local function stato_addosso(user)
  local st = ecs.get(user, "stati")
  if not st then return nil end
  for _, nome in ipairs(STATI_ORDINE) do
    if st[nome] then return nome end
  end
  return nil
end

local function discorso(id)
  local d = ecs.get(id, "discorso")
  return { ramo = (d and d.ramo) or "nessuno", passo = (d and d.passo) or 0 }
end

local function avanza(id, ramo)
  local d = discorso(id)
  local lista = RAMI[ramo]
  local passo = 1
  if d.ramo == ramo then passo = math.min(#lista, d.passo + 1) end
  ecs.set(id, "discorso", { ramo = ramo, passo = passo })
  return lista[passo]
end

local function al_buio()
  local q = ecs.first("quartiere")
  local s = q and ecs.get(q, "quartiere")
  return s and s.buio
end

function M.on_spawn(id)
  local w = ecs.get(id, "wander")
  if w then w.speed = 0.7 + hash(id, 5) * 0.5 end
  ecs.set(id, "discorso", { ramo = "nessuno", passo = 0 })
end

function M.on_act(id, user, action)
  local s = stato_addosso(user)
  if s == "nascosto" and action ~= "rune" then return STATI.nascosto end
  if action == "saluta" then
    if al_buio() then return BUIO end
    local t = SALUTI[fase()]
    if s then t = t .. " " .. STATI[s] end
    return t
  end
  if action == "quartiere" or action == "mestiere" then return avanza(id, action) end
  if action == "insisti" then
    return INSISTI[discorso(id).ramo] or INSISTI.nessuno
  end
  if action == "rune" then
    for _, token in ipairs(ORDINE) do
      if inventory.count(user, "rune:" .. token) > 0 then return RUNE[token] or RUNA_ALTRA end
    end
    return RUNA_NESSUNA
  end
  if action == "compra" then
    local it = items.find(COMPRA.oggetto)
    if not it then return "Oggi è finito tutto." end
    if inventory.count(user, "item.cento-lire") < COMPRA.prezzo then
      return "Non ti basta: servono " .. COMPRA.prezzo .. " monete da cento lire."
    end
    inventory.remove(user, "item.cento-lire", COMPRA.prezzo)
    inventory.add(user, it, COMPRA.quanti)
    return COMPRA.testo
  end
  return nil
end

return M
