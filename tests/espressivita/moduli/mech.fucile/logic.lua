-- Il fucile: un proiettile vero, un'entità che vola e si ferma contro ciò che è solido o contro chi colpisce.
local M = {}
local DIREZIONI = { up = { 0, -1 }, down = { 0, 1 }, left = { -1, 0 }, right = { 1, 0 } }
local VELOCITA, PASSO, DANNO = 20, 0.1, 10

function M.on_ui(user, azione)
  if azione ~= "spara" then return nil end
  local f = ecs.get(user, "fucile")
  if not f or f.colpi <= 0 then return "Click. Il caricatore è vuoto." end
  f.colpi = f.colpi - 1
  local p = world.player_pos()
  local dir = DIREZIONI[ecs.get(user, "player").facing] or DIREZIONI.down
  ecs.spawn({
    pos = { x = p.x + dir[1] * 0.4, y = p.y + dir[2] * 0.4 },
    proiettile = { vx = dir[1] * VELOCITA, vy = dir[2] * VELOCITA, fino = time + 1 },
    glyph = { ch = "*", color = "#ffee88" },
    light = { radius = 1, lit = true },
  })
  return "Bang!"
end

function M.update(dt)
  ecs.each("proiettile, pos", function(id, b, p)
    local tratto = math.sqrt(b.vx * b.vx + b.vy * b.vy) * dt
    local passi = math.ceil(tratto / PASSO)
    for _ = 1, passi do
      p.x = p.x + b.vx * dt / passi
      p.y = p.y + b.vy * dt / passi
      local colpito = world.nearest(p.x, p.y, 0.4, "bersaglio")
      if colpito then
        local s = ecs.get(colpito, "salute")
        s.valore = s.valore - DANNO
        world.speak(colpito, "Ahi!")
        if s.valore <= 0 then world.break_entity(colpito) end
        ecs.destroy(id)
        return
      end
      if not world.free_real(p.x, p.y, 0) then
        ecs.destroy(id)
        return
      end
    end
    if time > b.fino then ecs.destroy(id) end
  end)
end

return M
