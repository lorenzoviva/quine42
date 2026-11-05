-- Portuale: dialoghi a rami (saluto, quartiere, lavoro, insistere), reazioni alle rune che il viandante porta
-- e agli stati che le rune pronunciate gli lasciano addosso, uno scambio in monete. Il discorso vive nel componente
-- "discorso" dell'entità; il buio del quartiere lo dice sys.quartiere.
local M = {}

local SALUTI = {
  mattina = "Bonombo. Le barche sono rientrate, il mare era buono.",
  giorno = "Bonombo. Attento alla gru: quando gira, non guarda chi passa.",
  sera = "Bonombo. Stasera c’è l’assemblea al molo: si decide del porto.",
  notte = "Bonombo. Di notte il porto è un altro posto: parla piano.",
}

local RAMI = {
  quartiere = {
    "Il porto commerciale vuole le nostre banchine per i container. Noi abbiamo detto di no.",
    "Al magazzino sette arrivano casse senza bolla, di notte. Le scarica gente che non è della compagnia.",
    "Un signore in giacca ha offerto soldi per una firma. Gli abbiamo indicato dove finisce il molo.",
  },
  mestiere = {
    "Il nodo della bitta si impara una volta e non si scorda più.",
    "La gru è come una bestia grossa: se la tratti bene, ti obbedisce.",
    "Il mare dà e prende. Il porto pure.",
  },
}

local INSISTI = {
  quartiere = "Se vuoi vedere coi tuoi occhi, il magazzino sette sta in fondo alla banchina. Ma io non ti ho detto niente.",
  mestiere = "Vuoi una mano a scaricare? Allora prendi quella cima e non lasciarla.",
  nessuno = "Chi parla troppo al porto, finisce a nuotare.",
}

local RUNE = {
  marea = "La runa del mare che sale. I vecchi del molo la tengono sotto il cuscino: dicono che chiama il pesce.",
  nebbia = "Quella della foschia… al porto la conoscono tutti. Chi la usa, di solito, non scarica pesce.",
  lamiera = "La runa della serranda: ti protegge come un container. Utile, con le casse che cadono.",
  voce = "Con quella runa faresti spostare anche la gru.",
}
local RUNA_ALTRA = "Una runa. Una volta ne è salita una sulla rete, insieme alle alici. L’abbiamo rimessa sul molo."
local RUNA_NESSUNA = "Le rune? I pescatori le trovano sugli scogli, la mattina. Nessuno sa chi le mette."
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
  nascosto = "(fa un nodo alla cima, fischiettando, senza voltarsi) …Mi pareva di aver sentito passi.",
  allerta = "Hai la faccia di chi ha visto il libeccio arrivare. Che c’è?",
  carico = "Sembri pronto a scaricare un container da solo.",
  ["di corsa"] = "Non si corre sulla banchina! Ci si scivola e ci si bagna.",
}
local STATI_ORDINE = { "nascosto", "allerta", "di corsa", "carico" }

local COMPRA = {
  oggetto = "Cassetta di alici",
  prezzo = 2,
  quanti = 1,
  testo = "Pescate stanotte. Friggile subito, che domani non sono più loro.",
}

local BUIO = "È saltata la luce anche sulle banchine: le gru sono ferme. Perfetto, per chi scarica senza bolla."

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
  if w then w.speed = 0.5 + hash(id, 5) * 0.5 end
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
