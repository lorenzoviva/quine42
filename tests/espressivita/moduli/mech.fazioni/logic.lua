-- La legge: ciò che è sotto protezione si conta a ogni giro, perché nessun evento dice che qualcosa è stato rotto, né chi è stato.
-- Il reato si dà a chi sta più vicino: una congettura, l'unica possibile. Le guardie vanno da chi ha una taglia.
local M = {}

function M.on_ui(user, azione)
  local f = ecs.get(user, "fedina")
  if f and azione == "paga" then f.taglia = 0 end
  if azione == "abbatti" then
    local p = world.player_pos()
    local statua = nil
    ecs.each("protetto, pos", function(id, _, q)
      if math.abs(q.x - p.x) < 3 and math.abs(q.y - p.y) < 3 then statua = id end
    end)
    if statua then world.break_entity(statua) end
  end
  return nil
end

function M.update(dt)
  local me = world.player()
  local f = ecs.get(me, "fedina")
  if not f then return end
  local leggeId = ecs.first("legge")
  local l = ecs.get(leggeId, "legge")
  local n = 0
  ecs.each("protetto", function() n = n + 1 end)
  if l.visti and n < l.visti then
    f.reati = f.reati + (l.visti - n)
    f.taglia = f.taglia + 50 * (l.visti - n)
  end
  l.visti = n
  if f.taglia <= 0 then return end
  local w = world.player_pos()
  ecs.each("guardia, pos", function(id, g, p)
    local dx, dy = w.x - p.x, w.y - p.y
    local d = math.sqrt(dx * dx + dy * dy)
    if d > 1 then
      p.x, p.y = p.x + dx / d * g.passo * dt, p.y + dy / d * g.passo * dt
    elseif not g.detto then
      g.detto = true
      world.speak(id, "Fermo. C'è una taglia su di te.")
    end
  end)
end

return M
