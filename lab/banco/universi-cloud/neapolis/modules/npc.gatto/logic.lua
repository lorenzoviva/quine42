-- Gatto di quartiere: si lascia accarezzare (o no), mangia ciò che gli dai, sente le rune che porti.
-- Il suo umore vive nel componente "umore" dell'entità.
local M = {}

local FUSA = {
  "(si struscia sulle tue gambe e fa le fusa come un motorino al minimo)",
  "(si gira a pancia in su, poi ti graffia appena la mano. Miao.)",
  "(chiude gli occhi a metà e ti guarda dall'alto in basso)",
}

function M.on_spawn(id)
  local w = ecs.get(id, "wander")
  if w then w.speed = 1.6 + hash(id, 3) * 1.2 end
  ecs.set(id, "umore", { fiducia = math.floor(hash(id, 11) * 2) })
end

local function fiducia(id)
  local u = ecs.get(id, "umore")
  return (u and u.fiducia) or 0
end

function M.on_act(id, user, action)
  local st = ecs.get(user, "stati")
  if st and st["nascosto"] then return "(ti fissa dritto negli occhi, la coda gonfia: i gatti ti vedono anche nella foschia)" end
  if action == "accarezza" then
    if fiducia(id) < 1 then return "(si scansa con un salto e ti guarda offeso. Mrrr.)" end
    return FUSA[math.floor(hash(id, math.floor(time or 0)) * #FUSA) + 1]
  end
  if action == "sfama" then
    local cibo = nil
    for _, nome in ipairs({ "item.alici", "item.cornetto", "item.mozzarella" }) do
      if inventory.count(user, nome) > 0 then cibo = nome break end
    end
    if not cibo then return "(annusa le tue mani vuote e se ne va con la coda dritta)" end
    inventory.remove(user, cibo, 1)
    ecs.set(id, "umore", { fiducia = fiducia(id) + 1 })
    return "(mangia tutto in un boccone, si lecca i baffi e ti segue per tre passi. Miao!)"
  end
  if action == "rune" then
    if inventory.count(user, "rune:marea") > 0 then return "(annusa la tua tasca: sa di mare. Fa le fusa forte.)" end
    if inventory.count(user, "rune:corrente") > 0 then return "(il pelo gli si rizza tutto, come vicino a un quadro elettrico. Ffff!)" end
    return "(guarda la tua borsa delle rune, sbadiglia e si mette a dormire)"
  end
  return nil
end

return M
