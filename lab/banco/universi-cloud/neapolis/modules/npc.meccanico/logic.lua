-- Meccanico: dialoghi a rami (saluto, quartiere, lavoro, insistere), reazioni alle rune che il viandante porta
-- e agli stati che le rune pronunciate gli lasciano addosso, uno scambio in monete. Il discorso vive nel componente
-- "discorso" dell'entità; il buio del quartiere lo dice sys.quartiere.
local M = {}

local SALUTI = {
  mattina = "Bonombo. Se hai il motorino rotto, mettilo là in fila: prima i taxi.",
  giorno = "Bonombo. Passami quella chiave, già che ci sei.",
  sera = "Bonombo. Sto chiudendo, ma per un guasto vero apro sempre.",
  notte = "A quest’ora? Ti è morto il motore in mezzo alla strada, eh?",
}

local RAMI = {
  quartiere = {
    "Il Comune ha promesso di rifare il cavalcavia. Lo promette da quando ho aperto.",
    "I ragazzi truccano i motorini e poi si lamentano che consumano. Io li sistemo e loro li ritruccano.",
    "Di notte qualcuno prende il furgone dell’azienda della luce e va al porto. Non è Ciro. Ciro dorme.",
  },
  mestiere = {
    "Un motore ti dice tutto, basta ascoltarlo: tossisce, sbuffa, canta.",
    "I pezzi nuovi costano, quelli vecchi si aggiustano. Io aggiusto.",
    "Mia figlia sente un carburatore sbagliato da dieci metri. Io da cinque.",
  },
}

local INSISTI = {
  quartiere = "Non sono affari miei. Io riparo, non indago.",
  mestiere = "Vuoi imparare? Prendi uno straccio e pulisci quel pezzo. Poi ne parliamo.",
  nessuno = "Che vuoi? Parla chiaro, qui c’è da lavorare.",
}

local RUNE = {
  motore = "La runa del motorino! Se la pronunci, corri come un due tempi truccato. Ma il motore sei tu: attento.",
  corrente = "Quella dei fili accende le cose? Allora dalla a Lucia, alla centralina.",
  lamiera = "La runa della serranda. Ti protegge come una carrozzeria, dicono. Io preferisco il casco.",
  asfalto = "Una runa che fa le strade? Il Comune dovrebbe comprarne cento.",
}
local RUNA_ALTRA = "Una runa. Pesa poco, non si rompe, non consuma: è l’unica cosa che non devo riparare."
local RUNA_NESSUNA = "Rune? Mia madre dice che portano bene. Io dico che portano gente che fa domande."
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
  nascosto = "(alza la testa dal motore, guarda in giro, scuote le spalle) Il vento.",
  allerta = "Hai sentito anche tu quel rumore? Sembra una cinghia che slitta.",
  carico = "Stai lontano dai cavi della batteria, che sei già carico abbastanza.",
  ["di corsa"] = "Corri più tu dei motorini che riparo!",
}
local STATI_ORDINE = { "nascosto", "allerta", "di corsa", "carico" }

local COMPRA = {
  oggetto = "Pezzo di ricambio",
  prezzo = 2,
  quanti = 1,
  testo = "Tieni, è usato ma va. Se si rompe, non l’hai comprato da me.",
}

local BUIO = "È saltata la corrente: il compressore si è fermato. Qualcuno ha attaccato qualcosa di grosso."

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
  if w then w.speed = 0.4 + hash(id, 5) * 0.4 end
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
