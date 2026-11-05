-- Cuoco di trattoria: dialoghi a rami (saluto, quartiere, lavoro, insistere), reazioni alle rune che il viandante porta
-- e agli stati che le rune pronunciate gli lasciano addosso, uno scambio in monete. Il discorso vive nel componente
-- "discorso" dell'entità; il buio del quartiere lo dice sys.quartiere.
local M = {}

local SALUTI = {
  mattina = "Bonombo. Il ragù è sul fuoco da un’ora: torna a mezzogiorno.",
  giorno = "Bonombo! Siediti, mangia: sei magro come un lampione.",
  sera = "Bonombo. Stasera c’è il cuoppo di alici: le ha portate il molo.",
  notte = "La cucina è chiusa. Ma se hai fame, un panino lo trovo.",
}

local RAMI = {
  quartiere = {
    "Una volta il rione era tutto una famiglia. Adesso ci sono le antenne e nessuno si parla.",
    "Gli operai del cantiere ordinano e non pagano: dicono che paga il Comune. Il Comune chi?",
    "Il pagosso del rione dice che sotto il cantiere c’è un molo antico. Lui le cose le sa.",
  },
  mestiere = {
    "Il ragù vuole tempo. Chi ha fretta, si compri un panino.",
    "La pizza si piega in quattro e si mangia camminando: è il pranzo di chi lavora.",
    "Il pomodoro giusto viene dal mercato del Pendino, la mattina presto. Dopo le nove, è tardi.",
  },
}

local INSISTI = {
  quartiere = "Te l’ho detto: chiedi al pagosso. O alla dottoressa, che i feriti del cantiere li ricuce lei.",
  mestiere = "Vuoi imparare? Portami farina, pomodori e mozzarella, e ti faccio vedere.",
  nessuno = "Insisti? Prima mangia, poi ragioniamo.",
}

local RUNE = {
  pane = "La runa della sfornata! Se sfama davvero, chiudo la cucina e vado al mare.",
  fuoco = "Quella del fuoco. Attento alla cucina: qui c’è già abbastanza fuoco.",
  caffe = "La runa della tazzina: dopo pranzo serve, eccome.",
  marea = "La runa del mare. I pescatori dicono che chiama le alici. Speriamo.",
}
local RUNA_ALTRA = "Una runa. Mia nonna ne teneva una sopra il forno, per il pane. Il pane veniva buono lo stesso."
local RUNA_NESSUNA = "Le rune? In cucina non servono. Servono mani e pazienza."
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
  nascosto = "(mescola il ragù, assaggia, aggiunge sale) …C’è qualcuno in cucina? No.",
  allerta = "Che hai? Sembri uno che ha sentito bruciare il sugo.",
  carico = "Sei agitato. Siediti e mangia, che ti passa.",
  ["di corsa"] = "Non si corre in trattoria! Si rovesciano i piatti.",
}
local STATI_ORDINE = { "nascosto", "allerta", "di corsa", "carico" }

local COMPRA = {
  oggetto = "Pizza a portafoglio",
  prezzo = 2,
  quanti = 1,
  testo = "Tieni, mangiala calda e piegata in quattro. Seduto, no: camminando, come si deve.",
}

local BUIO = "Senza luce, la cucina va a gas e a candela. Come una volta. Quasi meglio."

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
  if w then w.speed = 0.4 + hash(id, 5) * 0.3 end
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
