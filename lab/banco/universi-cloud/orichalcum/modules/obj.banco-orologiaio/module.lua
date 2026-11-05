-- Banco dell'orologiaio: lavori fini con ciò che porti. Conta i lavori fatti nel componente banco.
local M = {}

local function ha(user, item, n) return inventory.count(user, item) >= (n or 1) end

local function fatto(id)
  local b = ecs.get(id, "banco")
  if b then b.lavori = (b.lavori or 0) + 1 end
end

function M.on_interact(id, user)
  local b = ecs.get(id, "banco")
  local n = b and b.lavori or 0
  if n == 0 then return "Il banco è in ordine: pinzette, lenti, viti piccole come semi." end
  return "Sul banco restano i segni di " .. n .. " lavori fatti, e un odore d'olio fine."
end

function M.on_act(id, user, action)
  if action == "ripara" then
    if not ha(user, "item.vetro-manometro") then return "Per ripararlo serve un vetro da manometro nuovo." end
    inventory.remove(user, "item.manometro-rotto", 1)
    inventory.remove(user, "item.vetro-manometro", 1)
    inventory.add(user, "item.manometro", 1)
    fatto(id)
    if ha(user, "item.lente-orologiaio") then return "Con la lente nell'occhio raddrizzi la lancetta e monti il vetro nuovo: un manometro tarato, perfetto." end
    return "Senza lente ci metti un'ora, ma alla fine la lancetta torna sullo zero: un manometro tarato."
  elseif action == "orologio" then
    if not ha(user, "item.ingranaggio", 2) or not ha(user, "item.lamina-ottone") then return "Per un orologio servono due ingranaggi, una molla e una lamina d'ottone." end
    inventory.remove(user, "item.ingranaggio", 2)
    inventory.remove(user, "item.molla-acciaio", 1)
    inventory.remove(user, "item.lamina-ottone", 1)
    inventory.add(user, "item.orologio-tasca", 1)
    fatto(id)
    local st = ecs.get(user, "stati")
    if st and st["passo a molla"] then return "Le mani ti vanno svelte come la molla negli stivali: l'orologio ticchetta al primo colpo." end
    return "Infili gli ingranaggi, carichi la molla, chiudi la cassa: l'orologio ticchetta forte."
  elseif action == "ingranaggi" then
    inventory.remove(user, "item.lamina-ottone", 1)
    inventory.add(user, "item.ingranaggio", 2)
    fatto(id)
    return "Con la seghetta fine tagli due ruote dentate dalla lamina, dodici denti ciascuna."
  elseif action == "studia" then
    local frasi = {
      "Un quadrante smontato: sotto la lancetta c'è una molla che respira.",
      "Un orologio aperto: ogni dente spinge il dente dopo, come le operaie dei telai si passano il canto.",
      "Un manometro della fonderia nuova: la vite di taratura è stata girata di mezzo giro. Da chi?",
    }
    return frasi[math.floor(hash(id, math.floor(time / 30)) * #frasi) + 1]
  end
  return M.on_interact(id, user)
end

return M
