-- Medico: dialoghi a rami (saluto, quartiere, lavoro, insistere), reazioni alle rune che il viandante porta
-- e agli stati che le rune pronunciate gli lasciano addosso, uno scambio in monete. Il discorso vive nel componente
-- "discorso" dell'entità; il buio del quartiere lo dice sys.quartiere.
local M = {}

local SALUTI = {
  mattina = "Bonombo… scusa, smonto adesso dal turno. Se non sanguini, ripassa domani.",
  giorno = "Bonombo. Siediti, ti misuro la pressione: si vede da lontano che non dormi.",
  sera = "Bonombo. Tra un’ora comincio la notte: dimmi tutto adesso.",
  notte = "Pronto soccorso: chi è il prossimo? Ah, sei tu. Cosa ti sei fatto?",
}

local RAMI = {
  quartiere = {
    "Nel rione ci si fa male per tre cose: i motorini, le scale e le liti in famiglia.",
    "Dal cantiere arriva un operaio ferito ogni settimana. Nessuno fa denuncia.",
    "L’altra notte un operaio mi ha detto che sotto la strada c’è un molo antico. Poi ha chiesto di non scriverlo.",
  },
  mestiere = {
    "La notte è lunga, ma la gente è più sincera: alle tre del mattino nessuno recita.",
    "Garze, cerotti, disinfettante e pazienza: il resto è fortuna.",
    "Ho ricucito metà del rione. L’altra metà la ricucirò.",
  },
}

local INSISTI = {
  quartiere = "Te l’ho detto: se vuoi saperne di più, chiedi ai vigili del cantiere. Uno dei due non dorme più.",
  mestiere = "Se ti interessa, porta garze e cerotti al pronto soccorso: ci servono sempre.",
  nessuno = "Non ho tempo per indovinelli. Sei ferito o no?",
}

local RUNE = {
  sutura = "La runa che ricuce. Se funziona come dicono, mi toglie metà del lavoro. Speriamo funzioni.",
  caffe = "Quella della tazzina? Dammela, faccio la notte e domani anche il giorno.",
  sirena = "La runa della sirena. Ne sento già abbastanza, di sirene.",
  nebbia = "Una runa per sparire? Ne conosco di pazienti che la vorrebbero, per scappare prima delle dimissioni.",
}
local RUNA_ALTRA = "Una runa. In corsia ne abbiamo trovata una sotto un letto: l’abbiamo lasciata lì. Non si sa mai."
local RUNA_NESSUNA = "Le rune? Non le prescrivo e non le vieto. Basta che non le ingoi."
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
  nascosto = "(guarda la sala d’aspetto e conta) …Uno in meno. Va bene così.",
  allerta = "Hai le pupille dilatate e il polso veloce. Siediti un attimo.",
  carico = "Sei teso come una corda di violino. Hai bevuto troppi caffè?",
  ["di corsa"] = "Non si corre nei corridoi! E nemmeno fuori, con quelle gambe.",
}
local STATI_ORDINE = { "nascosto", "allerta", "di corsa", "carico" }

local COMPRA = {
  oggetto = "Garza",
  prezzo = 1,
  quanti = 2,
  testo = "Ecco due garze. E la prossima volta guarda dove metti i piedi: il basolato non perdona.",
}

local BUIO = "È andata via la luce e il generatore dell’ospedale tossisce. Tienimi questa torcia, per favore."

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
