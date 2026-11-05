-- Sintetizzatore molecolare: trasforma materiali in altri materiali. Il calore accumulato vive nel componente "sintesi".
local M = {}

local function stato(id)
  local s = ecs.get(id, "sintesi")
  if not s then
    s = { calore = 0, ultimo = 0, cicli = 0 }
    ecs.set(id, "sintesi", s)
  end
  -- Il calore cala col tempo: un ciclo ogni venti secondi non lo surriscalda.
  local passato = time - (s.ultimo or 0)
  s.calore = math.max(0, (s.calore or 0) - passato * 0.05)
  return s
end

local function lavora(id, s)
  s.calore = s.calore + 1
  s.ultimo = time
  s.cicli = (s.cicli or 0) + 1
end

function M.on_act(id, user, action)
  local s = stato(id)
  if action == "guarda" then
    if s.calore > 2 then return "Il vetro del portello è appannato e la spia è rossa: il sintetizzatore deve raffreddarsi." end
    if (s.cicli or 0) == 0 then return "Dentro, un braccio sottile aspetta immobile in un bagno di luce viola. Non ha ancora lavorato oggi." end
    return "Dentro, il braccio sottile ripulisce il piatto. Ha già fatto " .. s.cicli .. " cicli."
  end
  if s.calore > 3 then
    return "Il sintetizzatore sbuffa vapore e rifiuta il lavoro: troppo caldo. Aspetta un poco."
  end
  if action == "metamateriale" then
    local polvere = items.find("Polvere di cristallo")
    local filo = items.find("Filo superconduttore")
    if not polvere or inventory.count(user, polvere) < 2 then return "Servono due misure di polvere di cristallo." end
    if not filo or inventory.count(user, filo) < 1 then return "Serve anche un filo superconduttore, per tenere la forma." end
    inventory.remove(user, polvere, 2)
    inventory.remove(user, filo, 1)
    inventory.add(user, items.find("Lastra di metamateriale"), 1)
    lavora(id, s)
    return "Il braccio stende la polvere, il filo la cuce: esce una lastra che piega la luce attorno ai bordi."
  end
  if action == "cella" then
    local plasma = items.find("Bottiglia di plasma")
    inventory.remove(user, plasma, 1)
    inventory.add(user, items.find("Cella energetica"), 2)
    lavora(id, s)
    return "Il plasma scende nel tubo con un sibilo: due celle energetiche si accendono di verde."
  end
  if action == "filo" then
    local lega = items.find("Lega grezza")
    inventory.remove(user, lega, 1)
    inventory.add(user, items.find("Filo superconduttore"), 1)
    lavora(id, s)
    return "Il lingotto si scalda, si allunga, si avvolge: una matassa di filo freddo come la brina."
  end
end

return M
