-- Capsula di salvataggio: si rifornisce con le razioni; la prima apertura trova le scorte di chi l'ha lasciata.
local M = {}

function M.on_act(id, user, action)
  local c = ecs.get(id, "capsula") or { razioni = 0, aperta = false }
  if action == "controlla" then
    if c.razioni >= 3 then return "Le scorte bastano per tre persone e tre turni." end
    return "Nello scomparto ci sono " .. c.razioni .. " razioni. Ne servono tre."
  elseif action == "rifornisci" then
    if c.razioni >= 3 then return "Lo scomparto è pieno." end
    inventory.remove(user, "item.razione", 1)
    c.razioni = c.razioni + 1
    ecs.set(id, "capsula", c)
    return "Infili la razione nello scomparto. Ora sono " .. c.razioni .. "."
  elseif action == "apri_portello" then
    if not c.aperta then
      c.aperta = true
      ecs.set(id, "capsula", c)
      world.make_container(id, 6, "capsula")
    end
    world.open(id)
    return "Il portello della capsula si apre con un sibilo: dentro odora di plastica nuova."
  end
  return nil
end

return M
