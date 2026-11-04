-- La bisca: una puntata alla volta, la ruota gira due secondi, il banco paga o incassa; a forza di giocare arriva la ronda.
local M = {}
local GIRO = 2

function M.on_ui(user, azione)
  local b = ecs.get(user, "bisca")
  if not b then return nil end
  if b.fino and b.fino > 0 then return "La ruota gira ancora." end
  if inventory.remove(user, "item.gettone", 1) < 1 then return "Non hai più gettoni." end
  b.puntata, b.fino, b.esito = azione, time + GIRO, "la ruota gira…"
  return nil
end

function M.update(dt)
  local me = world.player()
  local b = ecs.get(me, "bisca")
  if not b or not b.fino or b.fino <= 0 or time < b.fino then return end
  b.fino = 0
  local uscito = math.random() < 0.5 and "rosso" or "nero"
  b.sospetto = b.sospetto + 1
  if uscito == b.puntata then
    inventory.add(me, "item.gettone", 2)
    b.vinte, b.esito = b.vinte + 1, "esce " .. uscito .. ": paga il banco"
  else
    b.esito = "esce " .. uscito .. ": il banco incassa"
  end
  if b.sospetto >= 3 then
    -- La ronda: ciò che è sul tavolo sparisce con chi lo teneva.
    b.sospetto, b.esito = 0, "La ronda! Il banco sparisce coi gettoni."
    inventory.remove(me, "item.gettone", inventory.count(me, "item.gettone"))
  end
end

return M
