-- Edicola: i titoli cambiano ogni giorno (scelti dal giorno, uguali per tutti); si comprano il giornale e le cartoline.
local M = {}
-- La parte del giorno, come la conta il kernel (un giorno dura 600 secondi).
local function fase()
  local p = ((time or 0) / 600 + 0.12) % 1
  if p < 0.12 or p >= 0.96 then return "mattina" end
  if p < 0.42 then return "giorno" end
  if p < 0.58 then return "sera" end
  return "notte"
end

local function giorno() return math.floor((time or 0) / 600 + 0.12) end

-- Uno stato che le rune pronunciate lasciano addosso al viandante (vedi core.effects).
local function addosso(user, nome)
  local st = ecs.get(user, "stati")
  return st and st[nome] and true or false
end

local function quartiere()
  local q = ecs.first("quartiere")
  return q, q and ecs.get(q, "quartiere")
end

local function dai(user, nome, n)
  local it = items.find(nome)
  if it then return inventory.add(user, it, n or 1) end
  return 0
end

local TITOLI = {
  "«Linea 2, il cantiere chiude il Corso per la terza volta»",
  "«Il porto vuole il Molo Vecchio. I portuali: non lo avrete»",
  "«Torre C, la luce accesa al quattordicesimo piano. Il Comune: è vuota»",
  "«Blackout nel Rione delle Lavandaie: l’azienda accusa il cantiere»",
  "«Domenica il derby: a Radio Ciok Ciok i biglietti del quiz»",
  "«Il mercato del Pendino compie cent’anni: festa con le bancarelle»",
  "«Scavando la metropolitana, spunta un molo antico. Lavori fermi»",
}

function M.on_act(id, user, action)
  if action == "sfoglia" then
    local i = math.floor(hash(giorno(), 31) * #TITOLI) + 1
    local j = (i % #TITOLI) + 1
    return "In prima pagina: " .. TITOLI[i] .. ". Sotto, più piccolo: " .. TITOLI[j] .. "."
  end
  if action == "compra" then
    inventory.remove(user, "item.cento-lire", 1)
    dai(user, "Giornale del mattino", 1)
    return "Il giornale di oggi, ancora caldo di stampa. L’edicolante te lo piega in due, come si fa."
  end
  if action == "cartolina" then
    inventory.remove(user, "item.cento-lire", 1)
    dai(user, "Cartolina del golfo", 1)
    return "Una cartolina del golfo al tramonto. Dietro c’è spazio per scrivere: «Bonombo a domani»."
  end
  return nil
end

return M
