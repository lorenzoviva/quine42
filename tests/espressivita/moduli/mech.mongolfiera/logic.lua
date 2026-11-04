-- La mongolfiera: la fiamma scalda, l'aria calda alza, il gas finisce; il vento porta sopra ciò che a terra blocca.
local M = {}

function M.on_ui(user, azione)
  local v = ecs.get(user, "pallone")
  if not v then return nil end
  v.fiamma = azione == "fiamma"
  return nil
end

function M.update(dt)
  local me = world.player()
  local v = ecs.get(me, "pallone")
  if not v then return end
  if v.fiamma and v.gas > 0 then
    v.gas = math.max(0, v.gas - 10 * dt)
    v.quota = v.quota + 2 * dt
  else
    v.quota = math.max(0, v.quota - 0.5 * dt)
  end
  local p = ecs.get(me, "pos")
  -- Quello che il kernel lascia dell'altezza scritta al tick prima: il limite di questo scenario.
  v.z_letta = p.z or -1
  p.z = v.quota
  -- In quota il vento porta dove a piedi non si passa.
  if v.quota > 1 then p.x = p.x + 1.5 * dt end
end

return M
