-- Movimento del giocatore. Sistema senza stato: legge l'input, scrive la posizione.
local M = {}

local function step(p, b, dx, dy)
  local nx, ny = p.x + dx, p.y + dy
  if world.free_real(nx, p.y, b.r) then p.x = nx end
  if world.free_real(p.x, ny, b.r) then p.y = ny end
end

function M.update(dt)
  ecs.each("player, pos, body", function(id, pl, p, b)
    local dx, dy = 0, 0
    if input.held("left") then dx = dx - 1 end
    if input.held("right") then dx = dx + 1 end
    if input.held("up") then dy = dy - 1 end
    if input.held("down") then dy = dy + 1 end
    if dx ~= 0 and dy ~= 0 then dx, dy = dx * 0.7071, dy * 0.7071 end
    if dx > 0 then pl.facing = "right"
    elseif dx < 0 then pl.facing = "left"
    elseif dy > 0 then pl.facing = "down"
    elseif dy < 0 then pl.facing = "up" end
    step(p, b, dx * speed * dt, dy * speed * dt)
  end)
end

return M
