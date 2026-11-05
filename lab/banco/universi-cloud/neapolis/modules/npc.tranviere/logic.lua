-- Autista: dialoghi a rami (saluto, quartiere, lavoro, insistere), reazioni alle rune che il viandante porta
-- e agli stati che le rune pronunciate gli lasciano addosso, uno scambio in monete. Il discorso vive nel componente
-- "discorso" dell'entità; il buio del quartiere lo dice sys.quartiere.
local M = {}

local SALUTI = {
  mattina = "Bonombo. Il primo giro è il più bello: la città dorme ancora.",
  giorno = "Bonombo. Il Corso è bloccato dal cantiere: si va per il lungomare.",
  sera = "Bonombo. Ultimo giro e poi a casa.",
  notte = "Le corse della notte: si guadagna di più, si dorme di meno.",
}

local RAMI = {
  quartiere = {
    "La metropolitana non finirà mai: il cantiere ha chiuso il Corso tre volte.",
    "Dal Centro Direzionale escono signori in giacca che parlano al telefono di «sistemare il molo».",
    "Di notte un camion senza targa fa sempre lo stesso giro: cantiere, porto, cantiere.",
  },
  mestiere = {
    "Guidare in città è come ballare: se sai dove mette i piedi l’altro, non lo pesti.",
    "Il tram non sorpassa e non si ferma in seconda fila: per questo è il re della strada.",
    "Un buon autista conosce i nomi dei clienti, non le loro storie. Poi le storie arrivano lo stesso.",
  },
}

local INSISTI = {
  quartiere = "Vuoi vedere il camion? Aspetta la sera al cantiere della Linea 2, dalla parte del Pendino.",
  mestiere = "Se ti serve un passaggio, chiedi. Ma paghi in lire, non in rune.",
  nessuno = "Fermata a richiesta: dimmi dove vuoi andare, o scendi.",
}

local RUNE = {
  motore = "La runa del motorino! Con quella in tasca il mio mezzo andrebbe il doppio.",
  asfalto = "Quella che fa le strade: dalla al Comune, che il Corso è tutto buche.",
  voce = "La runa della voce: un clacson senza clacson.",
  sirena = "Il lampeggiante! Con quella runa avrei la strada libera all’ora di punta.",
}
local RUNA_ALTRA = "Una runa. Una volta un cliente me ne ha lasciata una al posto del biglietto. L’ho tenuta: era più bella."
local RUNA_NESSUNA = "Le rune? Ne vedo sui marciapiedi passando. Non mi fermo mai: ho l’orario."
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
  nascosto = "(controlla lo specchietto, aggrotta la fronte) …Avrei giurato di aver fatto salire qualcuno.",
  allerta = "Guardi la strada come uno che aspetta l’incidente. Rilassati.",
  carico = "Sei teso come il pantografo del tram.",
  ["di corsa"] = "Non serve correre dietro al tram: il prossimo passa tra dodici minuti. Forse.",
}
local STATI_ORDINE = { "nascosto", "allerta", "di corsa", "carico" }

local COMPRA = {
  oggetto = "Biglietto del tram",
  prezzo = 1,
  quanti = 2,
  testo = "Due biglietti. Timbrali, che il controllore di turno non perdona.",
}

local BUIO = "È saltata la luce e i semafori lampeggiano tutti gialli. Stanotte si guida a orecchio."

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
  if w then w.speed = 0.6 + hash(id, 5) * 0.6 end
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
