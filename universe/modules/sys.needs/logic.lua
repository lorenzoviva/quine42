-- Needs of the wanderer. Rates per second: in about ten minutes of walking hunger comes.
local M = {}

local CALO = { hunger = 0.12, thirst = 0.18, energy = 0.06 }

function M.update(dt)
  ecs.each("needs, player", function(id, n, pl)
    local moving = input.held("left") or input.held("right") or input.held("up") or input.held("down")
    local fatica = moving and 1.6 or 1
    n.hunger = math.max(0, n.hunger - CALO.hunger * dt)
    n.thirst = math.max(0, n.thirst - CALO.thirst * dt * fatica)
    n.energy = math.max(0, n.energy - CALO.energy * dt * fatica)
    if n.hunger <= 0 or n.thirst <= 0 then
      n.health = math.max(0, n.health - 0.6 * dt)
    elseif n.hunger > 50 and n.thirst > 50 then
      n.health = math.min(100, n.health + 0.08 * dt)
    end
    -- Mana comes back slowly, by itself; magic crystals give it back at once.
    n.mana = math.min(100, (n.mana or 0) + 0.12 * dt)
    if n.health <= 0 and not n.dead then
      -- The end of the journey: the kernel closes the session (one can go on in the same world).
      n.health = 0
      n.dead = true
      bus.emit("death", { hunger = n.hunger <= 0, thirst = n.thirst <= 0 })
    end
  end)
end

return M
