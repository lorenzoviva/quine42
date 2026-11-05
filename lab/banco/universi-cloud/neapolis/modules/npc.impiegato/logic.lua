-- Impiegato: dialoghi a rami (saluto, quartiere, lavoro, insistere), reazioni alle rune che il viandante porta
-- e agli stati che le rune pronunciate gli lasciano addosso, uno scambio in monete. Il discorso vive nel componente
-- "discorso" dell'entità; il buio del quartiere lo dice sys.quartiere.
local M = {}

local SALUTI = {
  mattina = "Bonombo. Timbro il cartellino e arrivo: le pratiche non aspettano.",
  giorno = "Bonombo. Pausa pranzo: un panino alla scrivania, come sempre.",
  sera = "Bonombo. Esco tardi anche oggi: l’archivio non finisce mai.",
  notte = "A quest’ora gli uffici sono vuoti. Quasi tutti.",
}

local RAMI = {
  quartiere = {
    "La Torre C è mezza vuota. Di notte, però, al quattordicesimo piano c’è una luce accesa.",
    "Le pratiche della Linea 2 hanno firme doppie, con date diverse. Le archivio io.",
    "Un fascicolo è sparito per un giorno ed è tornato con una pagina in più. Me ne sono accorto solo io.",
  },
  mestiere = {
    "Il protocollo è la memoria della città. Se qualcuno lo sporca, la città dimentica.",
    "Timbro, firma, archivio. Ogni pratica ha la sua cartellina, ogni cartellina il suo scaffale.",
    "La capoufficio legge tutto. Quasi tutto.",
  },
}

local INSISTI = {
  quartiere = "Se vuoi la verità, cerca l’archivio delle pratiche. Una cartellina gialla, l’ultima a destra.",
  mestiere = "Vuoi un consiglio? Non firmare mai una cosa che non hai letto.",
  nessuno = "Per favore, a bassa voce: qui le pareti hanno le orecchie.",
}

local RUNE = {
  nebbia = "La runa della foschia… con quella potrei uscire dall’archivio senza farmi vedere.",
  caffe = "La runa della tazzina: alle undici del mattino ne servirebbero due.",
  voce = "Con la runa della voce farei sentire alla capoufficio quello che penso. Meglio di no.",
  corrente = "La runa dei fili: al quattordicesimo piano qualcuno ha la luce senza contratto.",
}
local RUNA_ALTRA = "Una runa. Non c’è un modulo per denunciarla, quindi per l’ufficio non esiste."
local RUNA_NESSUNA = "Le rune? Non sono di competenza di questo ufficio. Provi allo sportello accanto."
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
  nascosto = "(alza gli occhi dalla pratica, si guarda attorno nervoso) …Chi ha aperto la porta?",
  allerta = "Ti guardi attorno come me in ascensore. Ti segue qualcuno?",
  carico = "Sei agitato. Anche io. Facciamo finta di niente.",
  ["di corsa"] = "Non si corre negli uffici: la capoufficio sente i passi.",
}
local STATI_ORDINE = { "nascosto", "allerta", "di corsa", "carico" }

local COMPRA = {
  oggetto = "Pratica timbrata",
  prezzo = 1,
  quanti = 1,
  testo = "Ecco la copia, timbrata. Ma non dire a nessuno da dove viene.",
}

local BUIO = "Blackout anche alla Torre C. Eppure, al quattordicesimo piano, c’è ancora una luce."

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
