-- Lampione: lo accende e lo spegne sys.quartiere (componente "luce"). Appoggiarsi riposa un poco.
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

function M.on_act(id, user, action)
  if action == "appoggiati" then
    local n = ecs.get(user, "needs")
    if n then n.energy = math.min(100, n.energy + 2) end
    if fase() == "sera" then return "Ti appoggi al lampione. Il rione si prepara alla sera: sedie in strada, radio accese, l’odore del sugo." end
    return "Ti appoggi alla ghisa fresca e riprendi fiato."
  end
  if action == "guarda" then
    local l = ecs.get(id, "luce")
    local _, s = quartiere()
    if s and s.buio then return "La lanterna è spenta, come tutte le altre: il quartiere è al buio. Qualcuno dovrebbe guardare la cabina elettrica." end
    if l and l.accesa then return "La lanterna è accesa e ci girano attorno tre falene." end
    return "La lanterna è spenta: si accenderà al tramonto."
  end
  return nil
end

return M
