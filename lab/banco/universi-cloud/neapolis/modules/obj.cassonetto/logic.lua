-- Cassonetto: una volta al giorno ci si trova qualcosa (scelto dal giorno e dal cassonetto); dentro ci si butta.
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

local DENTRO = { "Fusibile bruciato", "Pezzo di ricambio", "Giornale del mattino", "Moneta da cento lire", "Cavo elettrico", "Lampadina" }

function M.on_act(id, user, action)
  if action == "rovista" then
    local r = ecs.get(id, "rovistato")
    if r and r.giorno == giorno() then return "Sacchi, bucce e cartoni. Per oggi hai già trovato quello che c’era." end
    ecs.set(id, "rovistato", { giorno = giorno() })
    local nome = DENTRO[math.floor(hash(id, giorno(), 3) * #DENTRO) + 1]
    dai(user, nome, 1)
    return "Sollevi il coperchio, trattieni il fiato e frughi: trovi " .. nome .. ". Un gatto ti guarda dal muretto, offeso."
  end
  if action == "butta" then
    inventory.remove(user, "item.fusibile-bruciato", 1)
    return "Il fusibile cade in fondo con un tintinnio. La città è un po’ più pulita."
  end
  return nil
end

return M
