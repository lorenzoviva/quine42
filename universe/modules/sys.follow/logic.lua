-- Seguire: la decisione la prende il personaggio parlando (mind.mode = "segui"), qui la si esegue.
local M = {}

function M.update(dt)
  local target = world.player_pos()
  ecs.each("mind, pos, body", function(id, mind, p, b)
    if mind.mode ~= "segui" then return end
    local dx, dy = target.x - p.x, target.y - p.y
    local d = math.sqrt(dx * dx + dy * dy)
    if d < 1.4 then return end
    if d > 14 then mind.mode = "vaga" return end -- ti ha perso di vista
    local w = ecs.get(id, "wander")
    local v = ((w and w.speed or 1.2) + 1.5) * world.speed_at(p.x, p.y) * dt
    local nx, ny = p.x + dx / d * v, p.y + dy / d * v
    if world.free(nx, p.y, b.r) then p.x = nx end
    if world.free(p.x, ny, b.r) then p.y = ny end
  end)
end

return M
