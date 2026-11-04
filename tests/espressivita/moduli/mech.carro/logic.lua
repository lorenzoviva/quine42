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
  local n = 0
  ecs.each("player", function() n = n + 1 end)
  c.visti = n
  -- Solo chi tiene la tastiera di questo kernel ha dei tasti, e il sistema non gira per ogni viandante.
  if input.held("right") then c.tasti = c.tasti + 1 end
  if c.guidatore == 0 then return end
  ecs.each("a_bordo, pos", function(_, _, p) p.x = p.x + VELOCITA * dt end)
end

return M
