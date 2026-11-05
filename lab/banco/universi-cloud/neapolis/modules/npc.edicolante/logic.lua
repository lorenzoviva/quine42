-- Edicolante: dialoghi a rami (saluto, quartiere, lavoro, insistere), reazioni alle rune che il viandante porta
-- e agli stati che le rune pronunciate gli lasciano addosso, uno scambio in monete. Il discorso vive nel componente
-- "discorso" dell'entità; il buio del quartiere lo dice sys.quartiere.
local M = {}

local SALUTI = {
  mattina = "Bonombo! I giornali sono appena arrivati: il cantiere è di nuovo in prima pagina.",
  giorno = "Bonombo. Vuoi il fotoromanzo nuovo? È arrivato stamattina.",
  sera = "Bonombo. Chiudo il chiosco, ma le notizie restano aperte.",
  notte = "A quest’ora le edicole dormono. Io no, ma l’edicola sì.",
}

local RAMI = {
  quartiere = {
    "Ciok Ciok ieri sera ha detto che il porto vende le banchine. Lo sa anche Ciok Ciok, quindi lo sanno tutti.",
    "Il professore del Colle compra tutti i giornali che parlano di rune. Li tengo da parte per lui.",
    "I gabbiani volano bassi sul mercato: domani piove. La radio dirà sole.",
  },
  mestiere = {
    "Un’edicola è una finestra: tu guardi fuori, la città guarda dentro.",
    "Le figurine si vendono, i giornali si leggono, i fotoromanzi si nascondono.",
    "Quarant’anni di giornali: ho letto più notizie io di un direttore.",
  },
}

local INSISTI = {
  quartiere = "Se vuoi sapere del professore, vai al Colle dei Gelsi, al belvedere. Ma porta qualcosa da vendergli.",
  mestiere = "Il mestiere? Alzarsi alle quattro, non leggere i giornali che vendi, ricordarti chi compra cosa.",
  nessuno = "Insisti? Prima compra qualcosa, che qui non è la biblioteca.",
}

local RUNE = {
  voce = "La runa della voce! Con quella, gli strilloni di una volta avrebbero venduto il doppio.",
  nebbia = "Quella della foschia: i gabbiani spariscono quando c’è la foschia. E pure i debitori.",
  pane = "La runa della sfornata. Al mercato ne parlano tutti, nessuno l’ha mai vista.",
  tufo = "La runa del tufo: il professore del Colle dice che è la più vecchia della città.",
}
local RUNA_ALTRA = "Una runa! Al mercatino della domenica i ragazzi le vendono, ma metà sono pietre dipinte. Questa no: questa fa luce."
local RUNA_NESSUNA = "Le rune? Il professore del Colle le compra tutte. Chissà cosa ci fa."
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
  nascosto = "(sistema le riviste, borbotta) Il vento muove le pagine…",
  allerta = "Che occhi! Sembri uno che ha letto la notizia prima che succeda.",
  carico = "Sei agitato come un’edicola il giorno del derby.",
  ["di corsa"] = "Corri, corri: il tram passa ogni dodici minuti, dice l’orario.",
}
local STATI_ORDINE = { "nascosto", "allerta", "di corsa", "carico" }

local COMPRA = {
  oggetto = "Bustina di figurine",
  prezzo = 1,
  quanti = 2,
  testo = "Due bustine. Se trovi il portiere della squadra, te lo cambio con tre doppioni.",
}

local BUIO = "Buio pesto. Domani in prima pagina: il rione al buio, terza volta in un mese."

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
  if w then w.speed = 0.3 + hash(id, 5) * 0.3 end
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
