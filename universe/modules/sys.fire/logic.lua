-- Fuoco, luci evocate e scudi: tutto ciò che dura un poco e poi passa.
local M = {}

local INFIAMMABILE = { "infiammabile", "legno", "paglia", "tagliabile" }

function M.update(dt)
  local pl = world.player()
  local pp = world.player_pos()
  local scudo = ecs.get(pl, "scudo")
  if scudo and time > scudo.fino then
    ecs.set(pl, "scudo", { fino = 0, spento = true })
    scudo = nil
  end
  local protetto = scudo and not scudo.spento
  ecs.each("effimero, pos", function(id, e, p)
    if time > e.fino then
      ecs.destroy(id)
      return
    end
    local f = ecs.get(id, "fuoco")
    if not f then return end
    local r = f.raggio or 1
    for _, tag in ipairs(INFIAMMABILE) do
      local t = world.nearest(p.x, p.y, r + 0.6, tag)
      if t and t ~= pl then world.break_entity(t) end
    end
    local dx, dy = pp.x - p.x, pp.y - p.y
    if not protetto and dx * dx + dy * dy < (r + 0.3) * (r + 0.3) then
      local n = ecs.get(pl, "needs")
      if n then n.health = math.max(1, n.health - 6 * dt) end
    end
  end)
end

return M
