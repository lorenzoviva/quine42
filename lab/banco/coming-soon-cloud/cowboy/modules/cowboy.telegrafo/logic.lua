-- Telegrafo: i messaggi restano sul nastro dell'entità, gli ultimi tre, finché qualcuno non ne batte altri.
local M = {}
local MESSAGGI = {
  "ARRIVO CON IL TRENO DEL TRAMONTO STOP PORTATE IL CARRO STOP",
  "PREZZO DEI MANZI RADDOPPIATO STOP NON VENDETE STOP",
  "PIOGGIA SULLE MONTAGNE STOP IL FIUME SALIRA' STOP",
  "MANDATE TRAVI ALLA MINIERA STOP SUBITO STOP",
  "TUTTO BENE STOP SALUTATE LA MAMMA STOP",
}

function M.on_act(id, user, action)
  local t = ecs.get(id, "nastro") or { righe = {}, battuti = 0 }
  if action == "batti" then
    inventory.remove(user, "item.dollaro", 1)
    t.battuti = t.battuti + 1
    local m = MESSAGGI[(t.battuti - 1) % #MESSAGGI + 1]
    table.insert(t.righe, m)
    while #t.righe > 3 do table.remove(t.righe, 1) end
    ecs.set(id, "nastro", t)
    return "Batti il tasto, lungo e corto: «" .. m .. "»"
  elseif action == "nastro" then
    if #t.righe == 0 then return "Il nastro è bianco: oggi non è partito niente." end
    return "Sul nastro: " .. table.concat(t.righe, " / ")
  elseif action == "ascolta" then
    if hash(id, math.floor(time / 20)) < 0.5 then return "Il ricevitore ticchetta: qualcuno, di là dalle montagne, sta chiedendo del treno." end
    return "Il ricevitore tace. Si sente solo il vento nei fili."
  end
  return nil
end

return M
