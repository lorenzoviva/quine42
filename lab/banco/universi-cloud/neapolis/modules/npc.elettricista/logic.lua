-- Elettricista: dialoghi a rami (saluto, quartiere, lavoro, insistere), reazioni alle rune che il viandante porta
-- e agli stati che le rune pronunciate gli lasciano addosso, uno scambio in monete. Il discorso vive nel componente
-- "discorso" dell'entità; il buio del quartiere lo dice sys.quartiere.
local M = {}

local SALUTI = {
  mattina = "Bonombo. Stamattina tre lampioni spenti al rione: comincio da quelli.",
  giorno = "Bonombo. Non toccare quel quadro: è vivo.",
  sera = "Bonombo. A quest’ora si accendono i lampioni: se ne vedi uno spento, dimmelo.",
  notte = "Sono di reperibilità. Se è saltata la corrente, lo so già.",
}

local RAMI = {
  quartiere = {
    "Il cantiere stacca la luce del rione per collegare le sue pompe. Tre volte in un mese.",
    "I contatori del cantiere girano al contrario. Chi li ha montati sapeva quello che faceva.",
    "Di notte, alla cabina del cantiere, c’è un quadro che non è dell’azienda. Ha un lucchetto nuovo.",
  },
  mestiere = {
    "La corrente non perdona: o la rispetti, o ti segna. Guarda la mia mano.",
    "Un quadro elettrico è come un condominio: ognuno tira il suo filo e nessuno paga le scale.",
    "Fusibile, nastro, pazienza. E le scarpe di gomma.",
  },
}

local INSISTI = {
  quartiere = "Se vuoi vedere il quadro col lucchetto, è nella cabina dietro la recinzione del cantiere. Porta un cacciavite.",
  mestiere = "Vuoi una mano? Trovami un fusibile bruciato: con un po’ di filo di rame lo rimettiamo a posto.",
  nessuno = "Parla chiaro, che ho le mani occupate e il quadro acceso.",
}

local RUNE = {
  corrente = "La runa dei fili! Accende senza contatore. Se lo scopre l’azienda, la mettono a bilancio.",
  sirena = "Quella del lampeggiante: luce rossa senza un filo. Me la presti per i lavori notturni?",
  lamiera = "La runa della serranda. Peccato che non isoli dalla corrente.",
  luce = "Una runa che fa luce! Se ne trovo dieci, il rione non resta più al buio.",
}
local RUNA_ALTRA = "Una runa. Nessun filo, nessuna batteria, e quella luce tenue. Non ci capisco niente, e mi piace."
local RUNA_NESSUNA = "Le rune? Fanno luce senza corrente. Per uno come me è quasi un’offesa."
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
  nascosto = "(controlla il tester, che segna qualcosa, poi niente) Strano. Una dispersione.",
  allerta = "Hai i capelli dritti. Hai toccato qualcosa che non dovevi?",
  carico = "Sei carico come un condensatore! Stammi lontano dal quadro.",
  ["di corsa"] = "Corri? Allora corri alla cabina e dimmi se la spia è rossa.",
}
local STATI_ORDINE = { "nascosto", "allerta", "di corsa", "carico" }

local COMPRA = {
  oggetto = "Fusibile",
  prezzo = 1,
  quanti = 2,
  testo = "Due fusibili, nuovi. Se salta il quadro di casa, non chiamare l’azienda: chiama me.",
}

local BUIO = "Blackout. Lo sapevo: hanno attaccato di nuovo le pompe del cantiere. Stavolta li becco."

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
  if w then w.speed = 0.6 + hash(id, 5) * 0.5 end
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
