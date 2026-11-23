-- Fire, summoned lights and shields: everything that lasts a little while and then passes.
local M = {}

local INFIAMMABILE = { "infiammabile", "legno", "paglia", "tagliabile" }

function M.update(dt)
  local pl = world.player()
  local pp = world.player_pos()
  local scudo = ecs.get(pl, "shield")
  if scudo and time > scudo.expires then
    ecs.set(pl, "shield", { expires = 0, off = true })
    scudo = nil
  end
  local protetto = scudo and not scudo.off
  ecs.each("ephemeral, pos", function(id, e, p)
    if time > e.expires then
      ecs.destroy(id)
      return
    end
    local f = ecs.get(id, "fire")
    if not f then return end
    local r = f.radius or 1
    -- Downwind (T484): where the world has a wind the fire reaches farther the way it blows and less against it; without, as before.
    local cx, cy, reach = p.x, p.y, r + 0.6
    local w = world.wind(p.x, p.y)
    if w and w.speed > 0.05 then
      cx = p.x + w.vx * r * 0.8
      cy = p.y + w.vy * r * 0.8
      reach = r + 0.6 + w.speed * 0.4
    end
    for _, tag in ipairs(INFIAMMABILE) do
      local t = world.nearest(cx, cy, reach, tag)
      if t and t ~= pl then world.break_entity(t) end
    end
    local dx, dy = pp.x - cx, pp.y - cy
    if not protetto and dx * dx + dy * dy < (r + 0.3) * (r + 0.3) then
      local n = ecs.get(pl, "needs")
      if n then n.health = math.max(1, n.health - 6 * dt) end
    end
  end)
end

return M
