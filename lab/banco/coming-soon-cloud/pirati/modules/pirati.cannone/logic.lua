-- Cannone di bordata: palla e polvere si caricano a parte; senza polvere non spara, senza palla spara a salve.
local M = {}

local function stato(id)
  return ecs.get(id, "cannone") or { palla = false, polvere = false, colpi = 0, sporco = false }
end

function M.on_spawn(id)
  ecs.set(id, "cannone", stato(id))
end

function M.on_act(id, user, action)
  local c = stato(id)
  local testo
  if action == "carica" then
    if c.palla then return "C'è già una palla in canna." end
    inventory.remove(user, "item.palla-cannone", 1)
    c.palla = true
    testo = "Spingi la palla in fondo alla canna con il calcatoio."
  elseif action == "innesca" then
    if c.sporco then return "La canna è piena di residui: prima passa lo scovolo." end
    if c.polvere then return "La polvere è già nel focone." end
    inventory.remove(user, "item.polvere-sparo", 1)
    c.polvere = true
    testo = "Versi la polvere nel focone e ci pigi sopra lo stoppaccio."
  elseif action == "spara" then
    if not c.polvere then return "Senza polvere il cannone resta muto." end
    c.polvere = false
    c.sporco = true
    c.colpi = c.colpi + 1
    if c.palla then
      c.palla = false
      testo = "BUM! L'affusto rincula e la palla fischia sopra l'acqua, lontano, fino a sollevare una colonna di spuma."
    else
      testo = "Un colpo a salve rimbomba sulla laguna: i gabbiani si alzano tutti insieme."
    end
  elseif action == "pulisci" then
    if not c.sporco then return "La canna è già pulita e lucida." end
    c.sporco = false
    testo = "Lo scovolo esce nero di fuliggine. Ora il cannone è pronto."
  else
    return nil
  end
  ecs.set(id, "cannone", c)
  return testo
end

return M
