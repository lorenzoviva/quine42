-- Pressione delle caldaie: stato nei componenti (caldaia, manometro), logica senza stato.
local M = {}

local MASSIMA = 12      -- atmosfere: oltre, le valvole di sfogo si aprono da sole
local FISCHIO = 9       -- da qui la caldaia fischia
local CONSUMO = 0.05    -- carbone bruciato al secondo, quando è accesa
local EVAPORA = 0.02    -- acqua consumata al secondo, quando è accesa

local function fiamma_vicina(x, y)
  local trovata = false
  ecs.each("effimero, fuoco, pos", function(_, _, _, p)
    local dx, dy = p.x - x, p.y - y
    if dx * dx + dy * dy < 2.25 then trovata = true end
  end)
  return trovata
end

function M.update(dt)
  if type(dt) ~= "number" or dt <= 0 then return end
  ecs.each("caldaia, pos", function(id, c, p)
    -- Una caldaia spenta con carbone e acqua si riaccende se una fiamma le arriva accanto.
    if not c.accesa and (c.carbone or 0) > 0 and (c.acqua or 0) > 0 and fiamma_vicina(p.x, p.y) then
      c.accesa = true
      world.speak(id, "Fuuum! Il fuoco prende.")
    end
    if c.accesa then
      if (c.carbone or 0) <= 0 or (c.acqua or 0) <= 0 then
        c.accesa = false
        world.speak(id, (c.acqua or 0) <= 0 and "La caldaia si spegne: non ha più acqua." or "La caldaia si spegne: il carbone è finito.")
      else
        c.carbone = math.max(0, c.carbone - CONSUMO * dt)
        c.acqua = math.max(0, c.acqua - EVAPORA * dt)
        c.pressione = math.min(MASSIMA + 2, (c.pressione or 0) + 0.25 * dt)
      end
    else
      c.pressione = math.max(0, (c.pressione or 0) - 0.4 * dt)
    end
    if c.pressione > MASSIMA then
      c.pressione = MASSIMA - 3
      c.sfoghi = (c.sfoghi or 0) + 1
      world.speak(id, "FSSSSSS! Le due valvole di sfogo si aprono insieme.")
    elseif c.pressione > FISCHIO and (c.fischio or 0) < time then
      c.fischio = time + 6
      world.speak(id, "Fiiii... la caldaia fischia.")
    end
  end)
  -- Ogni manometro segna la caldaia più vicina.
  ecs.each("manometro, pos", function(id, m, p)
    local c = world.nearest(p.x, p.y, 4, "caldaia")
    local cc = c and ecs.get(c, "caldaia")
    m.lettura = cc and math.floor((cc.pressione or 0) * 10 + 0.5) / 10 or 0
  end)
end

return M
