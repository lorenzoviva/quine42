-- Incudine del maniscalco: una barra diventa un ferro dopo tre colpi; il ferro si mette a un cavallo, ed è fatto bene se è caldo.
local M = {}

function M.on_act(id, user, action)
  local f = ecs.get(id, "forgia") or { colpi = 0, ferrati = 0 }
  local testo
  if action == "batti" then
    f.colpi = f.colpi + 1
    if f.colpi >= 3 then
      f.colpi = 0
      inventory.remove(user, "item.barra-ferro", 1)
      inventory.add(user, "item.ferro-cavallo", 1)
      testo = "Al terzo colpo la barra si piega a ferro di cavallo. Lo immergi nell'acqua: sfrigola."
    else
      testo = "Il martello suona sull'incudine: colpo " .. f.colpi .. " di tre."
    end
  elseif action == "ferra" then
    inventory.remove(user, "item.ferro-cavallo", 1)
    f.ferrati = f.ferrati + 1
    testo = "Sollevi lo zoccolo, appoggi il ferro, sette chiodi. Il cavallo batte la zampa, contento. Ferrati qui: " .. f.ferrati .. "."
  elseif action == "scintille" then
    return "Le scintille saltano e si spengono nella polvere prima di toccare terra."
  else
    return nil
  end
  ecs.set(id, "forgia", f)
  return testo
end

return M
