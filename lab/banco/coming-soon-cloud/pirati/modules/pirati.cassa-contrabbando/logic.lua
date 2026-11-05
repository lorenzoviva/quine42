-- Cassa di contrabbando: il lucchetto cede al terzo tentativo (o prima, se la cassa è vecchia); poi resta aperta.
local M = {}

function M.on_act(id, user, action)
  local c = ecs.get(id, "lucchetto") or { aperto = false, tentativi = 0 }
  if action == "esamina_marchi" then
    if c.aperto then return "Il lucchetto pende aperto. Nessun marchio della dogana: questa merce non ha pagato." end
    return "Nessun marchio della dogana, e un lucchetto nuovo. Chi l'ha chiusa non voleva visite."
  elseif action == "forza" then
    if c.aperto then
      world.open(id)
      return "Il lucchetto è già aperto."
    end
    c.tentativi = c.tentativi + 1
    if c.tentativi >= 3 or hash(id, c.tentativi) < 0.4 then
      c.aperto = true
      ecs.set(id, "lucchetto", c)
      world.make_container(id, 8, "contrabbando")
      world.open(id)
      return "Clac. Il lucchetto cede e il coperchio si alza con un cigolio."
    end
    ecs.set(id, "lucchetto", c)
    return "Il grimaldello gira a vuoto. Il lucchetto resiste."
  end
  return nil
end

return M
