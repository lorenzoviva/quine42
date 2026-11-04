-- Il Rimbalzo: una palla, due porte alle estremità del campo, un avversario che corre verso la palla. Chi la tocca la rilancia verso l'altra porta.
local M = {}
local CAMPO, TOCCO = 4, 0.8

function M.on_ui(user, azione)
  local g = ecs.get(user, "partita")
  local id = ecs.first("palla")
  if not g or not id then return nil end
  local v = ecs.get(id, "palla")
  v.vx, v.vy = 2, 0.6
  g.via = true
  return "Si comincia."
end

function M.update(dt)
  local me = world.player()
  local g = ecs.get(me, "partita")
  local id = ecs.first("palla")
  if not g or not g.via or not id then return end
  local p, v = ecs.get(id, "pos"), ecs.get(id, "palla")
  p.x, p.y = p.x + v.vx * dt, p.y + v.vy * dt
  if math.abs(p.y) > 2.5 then v.vy = -v.vy end
  -- L'avversario corre verso la palla.
  ecs.each("avversario, pos", function(_, a, q)
    local dx, dy = p.x - q.x, p.y - q.y
    local d = math.sqrt(dx * dx + dy * dy)
    if d > 0.05 then
      q.x, q.y = q.x + dx / d * a.passo * dt, q.y + dy / d * a.passo * dt
    end
    if d < TOCCO and v.vx > 0 then v.vx, v.vy = -3, (math.random() - 0.5) * 2 end
  end)
  local w = world.player_pos()
  if math.abs(p.x - w.x) < TOCCO and math.abs(p.y - w.y) < TOCCO and v.vx < 0 then v.vx, v.vy = 3, (math.random() - 0.5) * 2 end
  if p.x > CAMPO or p.x < -CAMPO then
    if p.x > CAMPO then g.noi = g.noi + 1 else g.loro = g.loro + 1 end
    v.vx, v.vy = p.x > CAMPO and -2 or 2, 0.6
    p.x, p.y = 0.5, 0.5
  end
end

return M
