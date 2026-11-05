-- Dirigibile all'ormeggio: la Rondine si ripara con un tubo e una toppa; riparata, porta in giro chi sale.
local M = {}

local function aggiusta(d)
  if not d.riparato and (d.tubi or 0) >= 1 and (d.toppe or 0) >= 1 then
    d.riparato = true
    return " La Rondine è riparata: il bruciatore si accende e la tela si gonfia."
  end
  return ""
end

function M.on_interact(id, user)
  local d = ecs.get(id, "dirigibile")
  if not d then return "Un pilone vuoto." end
  if d.riparato then return "La Rondine dondola piano ai cavi, pronta a partire col vento da ponente." end
  local manca = {}
  if (d.tubi or 0) < 1 then manca[#manca + 1] = "un tubo di rame per il bruciatore" end
  if (d.toppe or 0) < 1 then manca[#manca + 1] = "una toppa per lo squarcio" end
  return "La Rondine è ferita. Le serve " .. table.concat(manca, " e ") .. "."
end

function M.on_act(id, user, action)
  local d = ecs.get(id, "dirigibile")
  if not d then return "Il dirigibile è partito." end
  if action == "tubo" then
    inventory.remove(user, "item.tubo-rame", 1)
    d.tubi = (d.tubi or 0) + 1
    return "Avviti il tubo nuovo al bruciatore, stringendo bene i raccordi." .. aggiusta(d)
  elseif action == "toppa" then
    inventory.remove(user, "item.straccio", 1)
    d.toppe = (d.toppe or 0) + 1
    return "Cuci lo straccio unto sullo squarcio, a punti larghi da velaio." .. aggiusta(d)
  elseif action == "sali" then
    if not d.riparato then return "Con lo squarcio sul fianco la Rondine non si alza di un palmo." end
    d.voli = (d.voli or 0) + 1
    local st = ecs.get(user, "stati")
    if st and st["passo a molla"] then return "Salti sulla passerella con un balzo solo. Dall'alto la città è un tappeto di tetti, fumo e binari." end
    return "Sali la scaletta di corda. Dall'alto la città è un tappeto di tetti, fumo e binari che luccicano."
  elseif action == "osserva" then
    local f = (time / 600 + 0.12) % 1
    if f >= 0.42 then return "Il cielo si fa scuro sopra le Fonderie; il fumo sale giallo." end
    return "Nuvole basse da levante. Il vento da ponente non è ancora arrivato."
  end
  return M.on_interact(id, user)
end

return M
