-- Barista: dialoghi a rami (saluto, quartiere, lavoro, insistere), reazioni alle rune che il viandante porta
-- e agli stati che le rune pronunciate gli lasciano addosso, uno scambio in monete. Il discorso vive nel componente
-- "discorso" dell'entità; il buio del quartiere lo dice sys.quartiere.
local M = {}

local SALUTI = {
  mattina = "Bonombo! Il primo caffè della giornata è il più importante: siediti.",
  giorno = "Bonombo bonombo! Con questo caldo ci vuole una granita, altro che caffè.",
  sera = "Bonombo. La sera in piazza si sta bene: le sedie sono fuori, siediti pure.",
  notte = "Stiamo chiudendo, ma un caffè per te lo faccio lo stesso.",
}

local RAMI = {
  quartiere = {
    "In piazza si sa tutto: chi si sposa, chi si separa, chi ha vinto al lotto e non l’ha detto.",
    "Quelli del cantiere vengono a fare colazione e non pagano mai: segnano tutto sul conto del Comune, dicono.",
    "Ti dico una cosa, ma non l’hai sentita da me: di notte, dal cantiere, escono camion senza targa.",
  },
  mestiere = {
    "Il caffè si fa con l’acqua giusta, la miscela giusta e la mano giusta. La mano non si compra.",
    "Il caffè sospeso è una cosa seria: lo paghi per chi viene dopo, e non chiedi chi è.",
    "Trent’anni dietro il bancone: ho visto passare sindaci, assessori e fidanzati. I clienti restano.",
  },
}

local INSISTI = {
  quartiere = "Più di così non ti dico. Ciok Ciok stasera ne parla, sentirai.",
  mestiere = "Vuoi imparare? Vieni alle sei, ti metto a lavare le tazzine.",
  nessuno = "Insisti su cosa? Prima prendi un caffè, poi parliamo.",
}

local RUNE = {
  caffe = "Quella col segno della tazzina? I ragazzi dicono che pronunciata ti sveglia meglio del mio caffè. Bugiardi.",
  pane = "La runa della sfornata! Se funziona davvero, chiudo il bar e mi metto in pensione.",
  voce = "Con quella runa in tasca dovresti fare il banditore al mercato, non il cliente al bar.",
  nebbia = "Quella della foschia? Al porto la cercano tutti, per sparire quando arriva il padrone.",
}
local RUNA_ALTRA = "Una runa! Il professore del Colle te la paga bene, quella. Io? Io non ci tocco, porta male al bancone."
local RUNA_NESSUNA = "Le rune? Alla radio ci ridono sopra. Ma se ne trovi una, fammela vedere."
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
  nascosto = "(guarda attraverso di te, asciugando una tazzina) …C’è qualcuno? Mi era sembrato.",
  allerta = "Che hai, gli occhi spalancati? Sembri uno dei vigili quando arriva l’assessore.",
  carico = "Mamma mia, sei elettrico! Niente caffè per te oggi.",
  ["di corsa"] = "Piano, piano! Qua si beve seduti, non è una gara.",
}
local STATI_ORDINE = { "nascosto", "allerta", "di corsa", "carico" }

local COMPRA = {
  oggetto = "Tazzina di caffè",
  prezzo = 1,
  quanti = 1,
  testo = "Ecco il caffè, bello mio: ristretto, come si deve. E un sorso d’acqua prima, mi raccomando.",
}

local BUIO = "È saltata la luce in tutta la piazza: chissà quelli del cantiere che hanno attaccato stavolta."

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
  if w then w.speed = 0.5 + hash(id, 5) * 0.4 end
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
