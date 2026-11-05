-- Chiave inglese: stringe i bulloni delle caldaie, sfoga le valvole, carica la molla dei guardiani d'ottone.
local M = {}

function M.on_action(user, target, item)
  if not target then return "Fai girare la ganascia a vuoto: clic, clic." end
  local a = ecs.get(target, "automa")
  if a then
    a.carica = 100
    return "Infili la chiave nella schiena del guardiano e giri: la molla si carica, gli occhi di vetro si riaccendono."
  end
  local c = ecs.get(target, "caldaia")
  if c then
    if (c.pressione or 0) > 9 then
      c.pressione = c.pressione - 2
      return "Stringi i bulloni del coperchio che fischiava: la caldaia si calma un poco."
    end
    return "Stringi un bullone allentato. La caldaia ronza, soddisfatta."
  end
  local v = ecs.get(target, "valvola")
  if v then
    v.tarata = true
    return "Dai un colpo di chiave al raccordo del manometro: la lancetta salta e si mette a posto."
  end
  local r = ecs.get(target, "ruote")
  if r then return "Le ruote dentate non si forzano con la chiave: bisogna girarle una per una." end
  if world.has_tag(target, "metallo") then return "Stringi tutto quello che c'è da stringere. Ora non cigola più." end
  return "La chiave non trova niente da stringere."
end

return M
