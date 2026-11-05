-- Astro-archeologo: rami sugli scafi antichi; con un frammento di relitto si apre la trama dei «più vecchi della Traversata».
local M = {}

local function d(id)
  local v = ecs.get(id, "dialogo")
  if not v then v = { fase = 0, fiducia = 0, scavi = 0 }; ecs.set(id, "dialogo", v) end
  -- Il manifest dà un dialogo con fase e fiducia soltanto: il resto si aggiunge qui.
  if v.scavi == nil then v.scavi = 0 end
  return v
end

function M.on_act(id, user, action)
  local v = d(id)
  if action == "scafi" then
    v.fase = v.fase + 1
    if inventory.count(user, "rune:tunnel") > 0 then return "«Hai Traforo con te! Pronunciata davanti a una lamiera apre un passaggio nella sabbia: è così che abbiamo trovato la costola grande.»" end
    if v.fase == 1 then return "«Queste lamiere non sono della Traversata. La lega è diversa, le giunture sono diverse. Chi le ha fatte, c'era prima di noi.»" end
    return "«Le compagnie vogliono chiudere lo scavo e fondere tutto. Una lamiera antica vale cento celle, al mercato. La storia, a quanto pare, niente.»"
  end
  if action == "frammento" then
    v.fiducia = v.fiducia + 2
    if v.fiducia >= 4 then return "«Un altro! Con due frammenti lo scanner può confrontare le incisioni. Guarda: cerchi concentrici, gli stessi dell'altra volta. È una rotta, ne sono sicura.»" end
    return "Lo prende con due dita, lo gira sotto la pioggia. «Incisioni geometriche. Non sono rune, non mandano luce. Ma qualcuno le ha fatte apposta. Me lo lasci guardare?»"
  end
  if action == "scava" then
    v.scavi = v.scavi + 1
    local n = ecs.get(user, "needs")
    if n then n.energy = math.max(0, n.energy - 10) end
    if v.scavi % 3 == 0 then
      inventory.add(user, items.find("Frammento di relitto"), 1)
      return "Dopo un'ora di setaccio la sabbia vitrea restituisce un frammento inciso. «Tienilo tu: te lo sei guadagnato.»"
    end
    return "Setacci sabbia vitrea per un'ora sotto la pioggia. Niente, ma ti ringraziano con un tè di serra tiepido."
  end
end

return M
