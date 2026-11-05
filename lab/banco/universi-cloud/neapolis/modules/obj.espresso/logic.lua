-- Macchina del caffè: con i chicchi fa due tazzine; il vapore scalda; il caffè sospeso si lascia e si prende.
-- I sospesi del bar vivono nel componente "sospesi" dell'entità.
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

function M.on_spawn(id)
  ecs.set(id, "sospesi", { n = 1 + math.floor(hash(id, 2) * 3) })
end

local function sospesi(id)
  local s = ecs.get(id, "sospesi")
  return (s and s.n) or 0
end

function M.on_act(id, user, action)
  if action == "caffe" then
    inventory.remove(user, "item.chicchi-caffe", 1)
    dai(user, "Tazzina di caffè", 2)
    if addosso(user, "carico") then return "La macchina sbuffa come un treno e i manometri vanno al massimo: due caffè così forti che fanno tremare il piattino." end
    return "Macinato, pressato, agganciato: la macchina gorgoglia e riempie due tazzine di crema scura."
  end
  if action == "vapore" then
    local n = ecs.get(user, "needs")
    if n then n.energy = math.min(100, n.energy + 3) end
    return "Uno sbuffo di vapore caldo ti appanna la faccia. Ti senti un po’ più sveglio."
  end
  if action == "sospeso" then
    inventory.remove(user, "item.cento-lire", 1)
    ecs.set(id, "sospesi", { n = sospesi(id) + 1 })
    return "Lasci pagato un caffè per chi verrà dopo. Al bancone qualcuno annuisce, senza dire niente."
  end
  if action == "prendi-sospeso" then
    local n = sospesi(id)
    if n <= 0 then return "Oggi i sospesi sono finiti. Domani, forse, qualcuno ne lascia uno." end
    ecs.set(id, "sospesi", { n = n - 1 })
    dai(user, "Tazzina di caffè", 1)
    return "Un caffè sospeso, per te. Nessuno chiede chi l’ha pagato: si usa così."
  end
  return nil
end

return M
