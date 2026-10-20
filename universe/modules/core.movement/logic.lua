-- Movimento del giocatore. Sistema senza stato: legge l'input, scrive la posizione.
-- Il terreno cambia il passo (world.speed_at), il carico lo appesantisce (pl.load > 1).
local M = {}

local function step(p, b, dx, dy)
  -- Se il mondo ti è cresciuto addosso (una casella appena diventata solida), puoi sempre uscirne.
  local stuck = not world.free_real(p.x, p.y, b.r)
  local nx, ny = p.x + dx, p.y + dy
  if stuck or world.free_real(nx, p.y, b.r) then p.x = nx end
  if stuck or world.free_real(p.x, ny, b.r) then p.y = ny end
end

function M.update(dt)
  ecs.each("player, pos, body", function(id, pl, p, b)
    local dx, dy = 0, 0
    if input.held("left") then dx = dx - 1 end
    if input.held("right") then dx = dx + 1 end
    if input.held("up") then dy = dy - 1 end
    if input.held("down") then dy = dy + 1 end
    if dx == 0 and dy == 0 then return end
    if dx ~= 0 and dy ~= 0 then dx, dy = dx * 0.7071, dy * 0.7071 end
    if dx > 0 then pl.facing = "right"
    elseif dx < 0 then pl.facing = "left"
    elseif dy > 0 then pl.facing = "down"
    else pl.facing = "up" end
    local here = world.player_pos()
    local terrain = world.speed_at(here.x, here.y)
    local burden = math.max(0.4, 1 - 0.5 * math.max(0, (pl.load or 0) - 1))
    -- Gli stati (a cavallo, in barca…) cambiano il passo.
    local stati = ecs.get(id, "stati")
    local mult = 1
    if stati then for _, s in pairs(stati) do mult = mult * (s.velocita or 1) end end
    local v = speed * terrain * burden * mult * dt
    step(p, b, dx * v, dy * v)
  end)
end

return M
