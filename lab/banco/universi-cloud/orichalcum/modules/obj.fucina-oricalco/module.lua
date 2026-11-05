-- Fucina d'oricalco: il calore sale col carbone e cala col tempo; a forno caldo si cola la lega.
local M = {}

local function calore(id)
  local f = ecs.get(id, "forno")
  if not f then return 0, nil end
  -- Il forno si raffredda da sé: un grado ogni due secondi da quando l'hai alimentato.
  if f.da then
    f.calore = math.max(0, (f.calore or 0) - (time - f.da) * 0.5)
    f.da = time
  end
  return f.calore or 0, f
end

function M.on_interact(id, user)
  local c = calore(id)
  if c >= 60 then return "La bocca del forno è bianca: è il calore giusto per l'oricalco." end
  if c >= 30 then return "Il forno è rosso, ma non basta ancora per la lega." end
  return "Il forno è tiepido. Serve carbone, tanto carbone."
end

function M.on_act(id, user, action)
  local c, f = calore(id)
  if not f then return "Il forno non risponde." end
  if action == "alimenta" then
    local n = inventory.remove(user, "item.carbone", 2)
    f.calore = math.min(100, c + n * 18)
    f.da = time
    return "Il mantice soffia, il carbone si accende: il forno sale a " .. math.floor(f.calore) .. " gradi di colore."
  elseif action == "cola" then
    if c < 60 then return "Il forno non è abbastanza caldo: il minerale resterebbe pietra." end
    if inventory.count(user, "item.minerale-rosso") < 2 or inventory.count(user, "item.lingotto-rame") < 1 then
      return "Per la lega servono due pezzi di minerale rosso e un lingotto di rame."
    end
    inventory.remove(user, "item.minerale-rosso", 2)
    inventory.remove(user, "item.lingotto-rame", 1)
    inventory.add(user, "item.lingotto-oricalco", 1)
    f.colate = (f.colate or 0) + 1
    f.calore = c - 25
    local st = ecs.get(user, "stati")
    if st and st["tempra d'ottone"] then return "Prendi il crogiolo a mani nude, la pelle dura come l'ottone: la colata scende rosso-dorata nello stampo." end
    return "Il crogiolo si inclina, la lega scende rosso-dorata nello stampo e fuma: un lingotto d'oricalco."
  elseif action == "tempra" then
    if c < 30 then return "Il forno è troppo freddo per temprare." end
    if inventory.count(user, "item.lingotto-zinco") < 1 then return "Per l'ottone serve anche un pane di zinco." end
    inventory.remove(user, "item.lingotto-rame", 1)
    inventory.remove(user, "item.lingotto-zinco", 1)
    inventory.add(user, "item.lamina-ottone", 3)
    f.calore = c - 10
    return "Rame e zinco si sposano nel crogiolo: martelli tre lamine d'ottone giallo."
  elseif action == "guarda" then
    local n = f.colate or 0
    if n == 0 then return "Il canale di colata è vuoto e annerito." end
    return "Nel canale restano le tracce di " .. n .. " colate, rosse come il tramonto sopra le Fonderie."
  end
  return M.on_interact(id, user)
end

return M
