-- Il carro: chi guida decide, chi è seduto viene portato. Due corpi che si muovono insieme, senza sapere dove sono nel mondo: solo di quanto.
local M = {}
local VELOCITA = 2

function M.on_ui(user, azione)
  local c = ecs.get(ecs.first("carro"), "carro")
  if azione == "sali" then ecs.set(user, "a_bordo", { sul = "carro" }) end
  if azione == "guida" then c.guidatore = user end
  return nil
end

function M.update(dt)
  local id = ecs.first("carro")
  if not id then return end
  local c = ecs.get(id, "carro")
  c.chi = world.player()
  c.visti = #world.wanderers()
  if c.guidatore == 0 then return end
  -- I tasti sono di chi guida, chiunque tenga la tastiera di questo kernel (T263: `input.held(azione, id)`).
  if input.held("right", c.guidatore) then c.tasti = c.tasti + 1 end
  ecs.each("a_bordo, pos", function(_, _, p) p.x = p.x + VELOCITA * dt end)
end

return M
