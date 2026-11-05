-- Serra idroponica: i germogli crescono col tempo, più in fretta se nutriti. Stato nel componente "serra".
local M = {}

local function s(id)
  local v = ecs.get(id, "serra")
  if not v then v = { crescita = 0, ultima = 0, nutrita = false }; ecs.set(id, "serra", v) end
  -- La crescita segue il tempo: un giorno di serra sono due minuti, il doppio se nutrita.
  local dt = math.max(0, time - (v.ultima or 0))
  v.crescita = math.min(100, (v.crescita or 0) + dt * (v.nutrita and 1.6 or 0.8))
  v.ultima = time
  return v
end

function M.on_act(id, user, action)
  local v = s(id)
  if action == "osserva" then
    if v.crescita >= 100 then return "Le vasche traboccano: frutti ambrati e foglie arrotolate, tutto maturo." end
    if v.crescita > 50 then return "I germogli sono alti un palmo e le prime foglie si srotolano a spirale." end
    return "Germogli piccoli, pallidi, sotto le lampade rosa. Ci vuole tempo, o soluzione nutritiva."
  end
  if action == "nutri" then
    inventory.remove(user, items.find("Soluzione nutritiva"), 1)
    v.nutrita = true
    v.crescita = math.min(100, v.crescita + 25)
    return "La soluzione verde scende nelle vasche con un gorgoglio; i germogli sembrano drizzarsi."
  end
  if action == "semina" then
    inventory.remove(user, items.find("Semi di Serralta"), 1)
    v.crescita = math.max(10, v.crescita)
    return "Spingi i semi nella spugna delle vasche, uno per foro, come insegna Iris Calandra."
  end
  if action == "raccogli" then
    if v.crescita < 60 then return "Non c'è ancora niente di maturo. Qualche foglia, al più." end
    local n = v.crescita >= 100 and 3 or 1
    inventory.add(user, items.find("Frutto di vetro"), n)
    inventory.add(user, items.find("Foglie di felce"), 2)
    v.crescita = 5
    v.nutrita = false
    return "Raccogli " .. n .. " frutti di vetro e una manciata di foglie di felce. Le vasche ricominciano."
  end
end

return M
