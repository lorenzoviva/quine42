-- Forziere sepolto: due palate per liberarlo, alla terza si apre; dentro c'è ciò che il seme dell'entità decide, una volta sola.
local M = {}

function M.on_act(id, user, action)
  local f = ecs.get(id, "forziere") or { palate = 0, vuoto = false }
  if action == "tasta" then
    if f.vuoto then return "La sabbia è smossa e il forziere è vuoto." end
    return "Sotto le dita senti il legno e il freddo delle borchie: è ancora chiuso."
  elseif action == "scava" then
    if f.vuoto then return "Hai già scavato qui: resta una buca e un forziere vuoto." end
    f.palate = f.palate + 1
    if f.palate < 3 then
      ecs.set(id, "forziere", f)
      return "La sabbia scivola via a palate. Il coperchio comincia a vedersi."
    end
    f.vuoto = true
    ecs.set(id, "forziere", f)
    local monete = 2 + math.floor(hash(id) * 4)
    inventory.add(user, "item.doblone", monete)
    if hash(id, 7) < 0.5 then
      inventory.add(user, "item.collana-corallo", 1)
      return "Il coperchio si apre: " .. monete .. " dobloni e una collana di corallo avvolta in una tela cerata."
    end
    return "Il coperchio si apre: " .. monete .. " dobloni, verdi di salsedine."
  end
  return nil
end

return M
