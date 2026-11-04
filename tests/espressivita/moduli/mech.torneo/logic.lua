-- Il torneo: chi si iscrive, a chi tocca, chi passa. Tutto in una tabella comune: chi tira lo dice il kernel (il primo argomento).
local M = {}

function M.on_ui(user, azione)
  local t = ecs.get(ecs.first("torneo"), "torneo")
  if azione == "iscriviti" then
    if t.a == 0 then t.a = user
    elseif t.b == 0 and t.a ~= user then t.b = user; t.turno = t.a; t.tabellone = "in gioco" end
    return "Iscritto."
  end
  if azione == "tira" then
    if user ~= t.turno then return "Non tocca a te." end
    local d = math.random(1, 6)
    if user == t.a then t.punti_a = t.punti_a + d; t.turno = t.b
    else t.punti_b = t.punti_b + d; t.turno = t.a end
    if t.punti_a >= 12 or t.punti_b >= 12 then
      t.tabellone = t.punti_a >= t.punti_b and "vince il primo" or "vince il secondo"
      t.turno = 0
    end
    return "Hai tirato " .. d
  end
  return nil
end

function M.update(dt)
  local id = ecs.first("torneo")
  if not id then return end
  local t = ecs.get(id, "torneo")
  -- Un pannello legge solo i componenti di chi guarda: ciò che è di tutti va copiato su ognuno, a ogni tick.
  ecs.each("player", function(w)
    ecs.set(w, "torneo_visto", { tabellone = t.tabellone, tocca = (t.turno == w) and "a te" or "aspetti" })
  end)
end

return M
