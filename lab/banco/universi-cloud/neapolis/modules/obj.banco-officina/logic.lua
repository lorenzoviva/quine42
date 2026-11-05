-- Banco d'officina: un pezzo di ricambio diventa due candele del motore; dal pannello si prende un attrezzo,
-- uno per visita (componente "pannello"); una radiolina sistemata prende Radio Ciok Ciok.
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

local ATTREZZI = { "Cacciavite", "Chiave inglese", "Nastro isolante" }

function M.on_act(id, user, action)
  if action == "ripara" then
    inventory.remove(user, "item.ricambio", 1)
    dai(user, "Candela del motore", 2)
    if addosso(user, "carico") then return "Appena tocchi la morsa scocca una scintilla: il pezzo si ripara quasi da solo. Due candele del motore, nuove." end
    return "Morsa, lima, un po’ d’olio: dal pezzo vecchio tiri fuori due candele del motore che sembrano nuove."
  end
  if action == "attrezzi" then
    local p = ecs.get(id, "pannello") or { presi = 0 }
    if p.presi >= #ATTREZZI then return "Il pannello è vuoto: restano solo le sagome degli attrezzi disegnate col pennarello." end
    local nome = ATTREZZI[p.presi + 1]
    ecs.set(id, "pannello", { presi = p.presi + 1 })
    dai(user, nome, 1)
    return "Stacchi dal pannello: " .. nome .. ". Il meccanico, se c’è, finge di non vedere."
  end
  if action == "radio" then
    local f = fase()
    if f == "sera" then return "Un colpo di cacciavite e la radiolina gracchia: è Radio Ciok Ciok, il quiz della sera. «La domanda di stasera: quante gru ha il porto?»" end
    return "Sistemi un filo e la radiolina prende Radio Ciok Ciok: canzoni, pubblicità del mobilificio, e la voce che dice che il porto vende le banchine."
  end
  return nil
end

return M
