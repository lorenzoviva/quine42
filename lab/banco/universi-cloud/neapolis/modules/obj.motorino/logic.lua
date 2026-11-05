-- Motorino: montato dà lo stato «in motorino» (più veloce, per un minuto) finché c'è miscela (componente "serbatoio");
-- chi porta la runa del motorino lo accende al primo colpo anche a secco.
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

local function metti_stato(user, nome, velocita, durata)
  local st = ecs.get(user, "stati") or {}
  st[nome] = { velocita = velocita, peso = 0, luce = 0, fino = time + durata }
  ecs.set(user, "stati", st)
end

function M.on_act(id, user, action)
  local s = ecs.get(id, "serbatoio") or { miscela = 0 }
  if action == "monta" then
    local runa = inventory.count(user, "rune:motore") > 0
    if s.miscela <= 0 and not runa then return "Pedali, pedali: il motore tossisce e muore. Il serbatoio è a secco: ci vuole la miscela." end
    if s.miscela > 0 then ecs.set(id, "serbatoio", { miscela = s.miscela - 1 }) end
    metti_stato(user, "in motorino", 1.7, 60)
    if runa then return "Al primo colpo di pedale il motore canta come nuovo. In tasca, la runa del motorino è tiepida." end
    return "Un colpo di pedale e il motorino parte con una nuvola blu. Il vento in faccia, il rione che scorre."
  end
  if action == "smonta" then
    local st = ecs.get(user, "stati")
    if st and st["in motorino"] then
      st["in motorino"] = false
      ecs.set(user, "stati", st)
      return "Scendi e lo rimetti sul cavalletto, in seconda fila. Come tutti."
    end
    return "Non ci sei sopra."
  end
  if action == "rifornisci" then
    inventory.remove(user, "item.olio-motore", 1)
    ecs.set(id, "serbatoio", { miscela = s.miscela + 3 })
    return "Benzina e un goccio d’olio, il tappo ben chiuso: la miscela basta per tre giri."
  end
  return nil
end

return M
