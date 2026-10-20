-- Uso generico degli oggetti, secondo categoria ed effetti (scritti dal Concilio nei pacchetti).
local M = {}

local VERBI = { cibo = "Mangi", bevanda = "Bevi", medicina = "Usi" }

local function clamp(v) return math.max(0, math.min(100, v)) end

function M.use(user, item)
  local d = items.def(item)
  if not d then return "Non sai cosa farne." end
  local verbo = VERBI[d.category]
  if verbo then
    local e = d.effects or {}
    local n = ecs.get(user, "needs")
    if n then
      n.hunger = clamp(n.hunger + (e.hunger or 0))
      n.thirst = clamp(n.thirst + (e.thirst or 0))
      n.energy = clamp(n.energy + (e.energy or 0))
      n.health = clamp(n.health + (e.health or 0))
    end
    inventory.remove(user, item, 1)
    return verbo .. ": " .. d.name .. "."
  end
  if d.category == "luce" then
    local l = ecs.get(user, "luce") or { accesa = false }
    l.accesa = not l.accesa
    ecs.set(user, "luce", l)
    return l.accesa and ("Accendi: " .. d.name .. ".") or ("Spegni: " .. d.name .. ".")
  end
  if d.category == "vestiario" then return "Indossi " .. d.name .. ". Ti sta come se fosse stato fatto per te." end
  return d.name .. ": non si usa così. Prova a impugnarlo (F) o a combinarlo."
end

return M
