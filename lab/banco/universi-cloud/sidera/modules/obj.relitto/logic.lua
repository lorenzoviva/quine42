-- Relitto antico: si fruga (poche volte), si taglia (una volta), si guardano le incisioni.
-- Reagisce alle rune del canone: con Traforo o Accresco in tasca, chi fruga trova di più.
local M = {}

local function r(id)
  local v = ecs.get(id, "relitto")
  if not v then v = { frugato = 0, tagliato = false }; ecs.set(id, "relitto", v) end
  return v
end

function M.on_act(id, user, action)
  local v = r(id)
  if action == "incisioni" then
    local forma = { "cerchi concentrici", "linee che si incrociano a stella", "spirali doppie", "file di punti come una rotta" }
    return "Sulla lamiera ci sono " .. forma[math.floor(hash(id, 31) * #forma) + 1] .. ", incise a fondo. Non sono rune: non mandano luce. Nessuno sa leggerle."
  end
  if action == "fruga" then
    if v.frugato >= 3 then return "Solo sabbia vitrea e ruggine: qui hai già preso tutto." end
    v.frugato = v.frugato + 1
    local fortuna = hash(id, v.frugato, 13)
    if inventory.count(user, "rune:tunnel") > 0 or inventory.count(user, "rune:massa") > 0 then fortuna = fortuna + 0.3 end
    if fortuna > 0.6 then
      inventory.add(user, items.find("Frammento di relitto"), 1)
      return "Tra due lamiere trovi un frammento con incisioni geometriche, liscio come un sasso di fiume."
    end
    if fortuna > 0.3 then
      inventory.add(user, items.find("Lega grezza"), 1)
      return "Stacchi un rivetto grosso come un pugno: è buona lega, si può fondere."
    end
    return "Le mani escono rosse di ruggine e vuote."
  end
  if action == "taglia" then
    if v.tagliato then return "Questa lamiera è già stata tagliata: il bordo è ancora lucido." end
    v.tagliato = true
    inventory.add(user, items.find("Lamiera antica"), 1)
    return "La taglierina sfrigola sotto la pioggia; una lamiera antica si stacca, più leggera di quanto sembri."
  end
end

return M
