-- Distributore: cento lire, una cosa a caso dalle spirali; scosso, a volte lascia cadere qualcosa, a volte niente.
-- Chi è carico della runa dei fili lo fa ripartire gratis. Lo stato vive nel componente "spirali".
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

local SPIRALI = { "Acqua minerale", "Caramella alla menta", "Pila", "Acqua minerale", "Cornetto" }

function M.on_spawn(id)
  ecs.set(id, "spirali", { scossoni = 0, giorno = -1 })
end

function M.on_act(id, user, action)
  local s = ecs.get(id, "spirali") or { scossoni = 0, giorno = -1 }
  if action == "compra" then
    inventory.remove(user, "item.cento-lire", 1)
    local nome = SPIRALI[math.floor(hash(id, giorno(), s.scossoni) * #SPIRALI) + 1]
    dai(user, nome, 1)
    ecs.set(id, "spirali", { scossoni = s.scossoni + 1, giorno = s.giorno })
    return "Clic, la spirale gira: cade " .. nome .. "."
  end
  if action == "gettone" then
    return "Il gettone entra, gira, e torna fuori dalla feritoia del resto. I distributori non telefonano."
  end
  if action == "scuoti" then
    if addosso(user, "carico") then
      dai(user, "Acqua minerale", 1)
      return "Appena lo tocchi, il distributore ronza, si illumina tutto e lascia cadere una bottiglia d’acqua. Chissà perché."
    end
    if s.giorno == giorno() then return "Lo scuoti, ma è già stato scosso oggi: dentro non si muove più niente." end
    ecs.set(id, "spirali", { scossoni = s.scossoni, giorno = giorno() })
    if hash(id, giorno(), 7) < 0.4 then
      dai(user, "Caramella alla menta", 1)
      return "Uno scossone, due scossoni: cade una caramella alla menta. Il vigile, da lontano, fa finta di non vedere."
    end
    return "Lo scuoti. Il distributore dondola, ronza, e non dà niente. Una signora ti guarda male."
  end
  return nil
end

return M
