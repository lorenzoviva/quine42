-- Giornalista: dialoghi a rami (saluto, quartiere, lavoro, insistere), reazioni alle rune che il viandante porta
-- e agli stati che le rune pronunciate gli lasciano addosso, uno scambio in monete. Il discorso vive nel componente
-- "discorso" dell'entità; il buio del quartiere lo dice sys.quartiere.
local M = {}

local SALUTI = {
  mattina = "Bonombo. Hai letto il giornale? No? Allora non sai niente della città.",
  giorno = "Bonombo, scusa, vado di fretta: c’è una conferenza stampa al Centro Direzionale.",
  sera = "Bonombo. La sera la gente parla di più: è il momento migliore per fare domande.",
  notte = "Chiudo il pezzo e vado a dormire. Forse.",
}

local RAMI = {
  quartiere = {
    "La città cambia in fretta: il porto vuole le banchine, il cantiere vuole le strade, gli uffici vogliono tutto.",
    "Al Centro Direzionale ci sono pratiche firmate due volte. Non chiedermi come lo so.",
    "Se vedi un camion uscire dal cantiere dopo le dieci, segnati l’ora. Mi fai un favore.",
  },
  mestiere = {
    "Una notizia vera vale più di dieci comunicati del Comune.",
    "Le fonti non si dicono. Mai. Nemmeno a mia madre.",
    "Il mestiere è semplice: guardi, chiedi, verifichi, scrivi. È il verificare che fa perdere amici.",
  },
}

local INSISTI = {
  quartiere = "Vuoi aiutarmi davvero? Parla con l’impiegato timido della Torre C. Ma senza farti vedere.",
  mestiere = "Se vuoi fare questo lavoro, comincia a portare sempre una penna.",
  nessuno = "Insistere è il mio mestiere, non il tuo. Fai una domanda vera.",
}

local RUNE = {
  voce = "La runa della voce. Alla radio vorrebbero un microfono così: parli e la gente si sposta.",
  sirena = "Quella del lampeggiante: con quella addosso arriveresti prima della polizia su ogni notizia.",
  nebbia = "Una runa per non farsi vedere? Utile a chi fa il mio lavoro. Anche a chi fa il contrario.",
  corrente = "La runa dei fili. Hai sentito che il cantiere stacca la luce al rione? Coincidenze.",
}
local RUNA_ALTRA = "Una runa vera. Ne ho scritto un articolo una volta: il direttore l’ha messo nella pagina degli spettacoli."
local RUNA_NESSUNA = "Le rune? Una storia da scrivere, un giorno. Chi le raccoglie, chi le vende, chi le pronuncia."
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
  nascosto = "(scrive sul taccuino senza alzare gli occhi) Strano, avrei giurato che qualcuno mi stesse leggendo da sopra la spalla.",
  allerta = "Hai la faccia di chi ha visto qualcosa. Raccontami tutto, ora.",
  carico = "Sei teso come un filo dell’alta tensione. Respira.",
  ["di corsa"] = "Corri anche tu? Dove, al cantiere? Aspettami!",
}
local STATI_ORDINE = { "nascosto", "allerta", "di corsa", "carico" }

local COMPRA = {
  oggetto = "Giornale del mattino",
  prezzo = 1,
  quanti = 1,
  testo = "Tieni, fresco di stampa. Leggi bene la terza pagina: l’ho scritta io.",
}

local BUIO = "Buio in tutto il quartiere. Stanotte scrivo a lume di candela, e domani scrivo di chi ha staccato la luce."

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
  if w then w.speed = 0.8 + hash(id, 5) * 0.6 end
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
