-- Telegrafo pneumatico: una capsula parte e, otto secondi dopo, ne arriva una (sys.meccanismi).
local M = {}

function M.on_interact(id, user)
  local t = ecs.get(id, "telegrafo")
  if t and t.in_viaggio then return "Dentro il tubo si sente correre una capsula: sta arrivando." end
  return "Lo sportello è chiuso. Sopra la fessura c'è scritto il prezzo: un soldo."
end

function M.on_act(id, user, action)
  local t = ecs.get(id, "telegrafo")
  if not t then return "Il telegrafo è muto." end
  if action == "invia" then
    if t.in_viaggio then return "Aspetta: c'è già una capsula nel tubo." end
    if inventory.remove(user, "item.soldo-rame", 1) <= 0 then return "Ti serve un soldo di rame." end
    t.in_viaggio = true
    t.arrivo = time + 8
    t.inviate = (t.inviate or 0) + 1
    return "Il soldo cade, tiri la leva: FOP! La capsula sparisce nel tubo con un soffio. La risposta arriverà presto."
  elseif action == "rimanda" then
    inventory.remove(user, "item.capsula-pneumatica", 1)
    if inventory.count(user, "item.caffe-nero") > 0 then
      return "Rimandi la capsula vuota con il profumo del caffè dentro, come si usa: chi l'ha mandata saprà che è arrivata."
    end
    return "Rimandi la capsula vuota: chi l'ha mandata saprà che è arrivata."
  elseif action == "ascolta" then
    if t.in_viaggio then return "Un fruscio che corre sotto i piedi, sempre più vicino." end
    return "Un respiro lungo, come il vento in un camino: il tubo è vuoto."
  end
  return M.on_interact(id, user)
end

return M
