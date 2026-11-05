-- Serratura a ingranaggi: tre ruote da dodici denti, accoppiate. La ruota grande trascina la media,
-- la media trascina la piccola di due denti. Si apre quando i tre denti segnati sono in alto (la
-- combinazione è fissata dal luogo dove sta la serratura).
local M = {}

local function meta(id)
  local o = ecs.get(id, "origin")
  local k = o and o.key or tostring(id)
  local h = 0
  for i = 1, #k do h = (h * 31 + string.byte(k, i)) % 1000003 end
  return math.floor(hash(h, 1) * 12), math.floor(hash(h, 2) * 12), math.floor(hash(h, 3) * 12)
end

local function descrivi(r, id)
  local ta, tb, tc = meta(id)
  local function quanto(v, t)
    local d = (t - v) % 12
    if d == 0 then return "in alto" end
    if d <= 3 or d >= 9 then return "vicino" end
    return "lontano"
  end
  return "Dente rosso della grande: " .. quanto(r.a, ta) .. "; della media: " .. quanto(r.b, tb) .. "; della piccola: " .. quanto(r.c, tc) .. "."
end

local function controlla(id, user, r)
  local ta, tb, tc = meta(id)
  if r.a == ta and r.b == tb and r.c == tc and not r.aperta then
    r.aperta = true
    inventory.add(user, "item.ingranaggio", 2)
    inventory.add(user, "item.molla-acciaio", 1)
    if hash(id, 9) < 0.5 then inventory.add(user, "item.cristallo-magico", 1) end
    bus.emit("enigma", { id = id, mosse = r.mosse })
    return " CLAC! I tre denti rossi sono in alto: dietro la piastra si apre uno sportellino, e dentro ci sono ingranaggi di ricambio."
  end
  return ""
end

function M.on_interact(id, user)
  local r = ecs.get(id, "ruote")
  if not r then return "Una piastra di ghisa." end
  if r.aperta then return "Lo sportellino è aperto: la serratura ha già detto il suo segreto." end
  return descrivi(r, id)
end

function M.on_act(id, user, action)
  local r = ecs.get(id, "ruote")
  if not r then return "La piastra non si muove." end
  if r.aperta then return "Le ruote girano a vuoto: la serratura è già aperta." end
  r.mosse = (r.mosse or 0) + 1
  if action == "prima" then
    r.a = (r.a + 1) % 12
    r.b = (r.b + 1) % 12
  elseif action == "seconda" then
    r.b = (r.b + 1) % 12
    r.c = (r.c + 2) % 12
  elseif action == "terza" then
    r.c = (r.c + 1) % 12
  elseif action == "guarda" then
    r.mosse = r.mosse - 1
    return descrivi(r, id)
  end
  return "Clic. " .. descrivi(r, id) .. controlla(id, user, r)
end

return M
