-- La cabina del cordone: un ciclo di 360 secondi; negli ultimi 4 la cabina tocca terra e le luci tremolano.
-- I droni consumano batteria. Niente stato nelle variabili: il ciclo si calcola dal tempo, la memoria sta nei componenti.
local M = {}

local CICLO = 360
local DISCESA = 4

local function in_discesa()
  return (time % CICLO) > (CICLO - DISCESA)
end

function M.update(dt)
  local giu = in_discesa()
  local id = world.player()
  local stato = id and ecs.get(id, "cordone")
  if id and not stato then
    stato = { annunciata = -1 }
    ecs.set(id, "cordone", stato)
  end
  local giro = math.floor(time / CICLO)
  if giu and stato and stato.annunciata ~= giro then
    stato.annunciata = giro
    world.say("La cabina scende lungo il cordone: per un attimo tutte le luci di Sidera tremolano.")
  end
  -- Le luci delle macchine: tremolano durante la discesa, poi tornano come erano.
  ecs.each("luce, faro", function(e, l, f)
    if giu then
      if f.tremolo == nil then f.tremolo = l.accesa and 1 or 0 end
      l.accesa = hash(e, math.floor(time * 6)) < 0.5
    elseif f.tremolo ~= nil then
      l.accesa = f.tremolo == 1
      f.tremolo = nil
    end
  end)
  -- I droni consumano la cella volando: scarichi, rallentano e si posano.
  ecs.each("drone, wander", function(e, d, w)
    d.batteria = math.max(0, (d.batteria or 100) - dt * 0.15)
    if d.batteria < 15 then
      w.speed = 0.3
    elseif w.speed < 1 then
      w.speed = 2.4
    end
  end)
end

return M
