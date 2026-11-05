-- Cassaforte a combinazione: tre numeri da dodici tacche, fissati dal luogo. Si gira la manopola, si ascolta
-- lo scatto quando la tacca è giusta, si tira la maniglia per fissarla. Tre tacche giuste e si apre.
-- Aperta, diventa un contenitore (bottino «cassaforte»); quella della fonderia vecchia custodisce un brevetto.
local M = {}

local function numeri(id)
  local o = ecs.get(id, "origin")
  local k = o and o.key or tostring(id)
  local h = 7
  for i = 1, #k do h = (h * 33 + string.byte(k, i)) % 1000003 end
  return { math.floor(hash(h, 11) * 12), math.floor(hash(h, 12) * 12), math.floor(hash(h, 13) * 12) }
end

local function giusta(id, c)
  local n = numeri(id)
  return c.tacca == n[(c.giusti or 0) + 1]
end

function M.on_interact(id, user)
  local c = ecs.get(id, "combinazione")
  if not c then return "Una cassaforte." end
  if c.aperta then
    world.open(id)
    return "Lo sportello pesante si apre sui cardini unti."
  end
  return "La manopola è sulla tacca " .. c.tacca .. ". Numeri già fissati: " .. (c.giusti or 0) .. " su tre."
end

function M.on_act(id, user, action)
  local c = ecs.get(id, "combinazione")
  if not c then return "La cassaforte non si muove." end
  if c.aperta then return M.on_interact(id, user) end
  if action == "destra" then
    c.tacca = (c.tacca + 1) % 12
    return "Clic. Tacca " .. c.tacca .. "."
  elseif action == "sinistra" then
    c.tacca = (c.tacca + 11) % 12
    return "Clic. Tacca " .. c.tacca .. "."
  elseif action == "ascolta" then
    local st = ecs.get(user, "stati")
    if giusta(id, c) then
      if st and st["calamitato"] then return "Senti uno scatto netto, e la limatura che hai addosso trema verso la manopola: questa tacca è giusta." end
      return "Dentro, uno scatto sordo: questa tacca è giusta."
    end
    return "Solo il fruscio della manopola."
  elseif action == "maniglia" then
    c.tentativi = (c.tentativi or 0) + 1
    if not giusta(id, c) then
      c.giusti = 0
      return "La maniglia non cede, e senti le tacche già fissate ricadere giù. Si ricomincia."
    end
    c.giusti = (c.giusti or 0) + 1
    if c.giusti < 3 then return "La maniglia scende di un dente: " .. c.giusti .. " numeri fissati." end
    c.aperta = true
    world.make_container(id, 8, "cassaforte")
    local o = ecs.get(id, "origin")
    if o and o.key and string.find(o.key, "^0,%-2#") and not c.brevetto then
      c.brevetto = true
      inventory.add(user, "item.brevetto-lenti", 1)
      world.open(id)
      return "CLONK. Lo sportello si apre: sopra i lingotti c'è una cartella di fogli bruciacchiati, con la firma di Amedeo Lenti."
    end
    world.open(id)
    return "CLONK. Lo sportello si apre con un sospiro d'aria vecchia."
  end
  return M.on_interact(id, user)
end

return M
