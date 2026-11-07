-- Movement of the player. A stateless system: it reads the input, writes the position.
-- The terrain changes the pace (world.speed_at), the load weighs it down (pl.load > 1).
local M = {}

local function step(p, b, dx, dy)
  -- p.z is the height of the feet (the floor one stands on, kept by the kernel): on top of a floor one walks on it.
  -- If the world has grown over you (a tile that just became solid), you can always get out.
  local stuck = not world.free_real(p.x, p.y, b.r, p.z)
  local nx, ny = p.x + dx, p.y + dy
  if stuck or world.free_real(nx, p.y, b.r, p.z) then p.x = nx end
  if stuck or world.free_real(p.x, ny, b.r, p.z) then p.y = ny end
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
    -- States (on horseback, in a boat…) change the pace: the kernel keeps their product in pl.step.
    local mult = tonumber(pl.step) or 1
    local v = speed * terrain * burden * mult * dt
    step(p, b, dx * v, dy * v)
  end)
end

return M
