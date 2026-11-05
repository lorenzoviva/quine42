-- Scialuppa: con la falla non galleggia; si vara solo se c'è acqua a due passi.
local M = {}

local function scafo(id) return ecs.get(id, "scafo") or { falla = true, varata = false } end

local function acqua_vicina(id)
  local p = ecs.get(id, "pos")
  if not p then return false end
  for dx = -2, 2 do
    for dy = -2, 2 do
      local t = world.tile(p.x + dx, p.y + dy)
      if t == "w" or t == "o" then return true end
    end
  end
  return false
end

function M.on_act(id, user, action)
  local s = scafo(id)
  if action == "controlla" then
    if s.falla then return "Sul fondo c'è una falla grande come un pugno: così affonda." end
    return s.varata and "Lo scafo è asciutto e già in acqua." or "Lo scafo è sano, pronto per essere varato."
  elseif action == "ripara" then
    if not s.falla then return "La falla è già chiusa: la pece è dura come pietra." end
    inventory.remove(user, "item.pece", 1)
    s.falla = false
    ecs.set(id, "scafo", s)
    return "Spalmi la pece calda sulla falla e ci premi sopra una pezza di tela."
  elseif action == "vara" then
    if s.falla then return "Con quella falla affonderebbe prima di uscire dalla risacca." end
    if not acqua_vicina(id) then return "Qui l'acqua è troppo lontana: ci vorrebbe una ciurma per trascinarla." end
    s.varata = true
    ecs.set(id, "scafo", s)
    return "Spingi la scialuppa sulla sabbia bagnata finché l'acqua non la solleva."
  end
  return nil
end

return M
