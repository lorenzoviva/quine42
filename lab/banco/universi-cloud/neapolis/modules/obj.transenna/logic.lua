-- Transenna del cantiere: di giorno si vedono gli operai, di notte il camion senza targa; nella terra smossa, una volta
-- per transenna, un coccio antico del molo (componente "scavato").
local M = {}
-- La parte del giorno, come la conta il kernel (un giorno dura 600 secondi).
local function fase()
  local p = ((time or 0) / 600 + 0.12) % 1
  if p < 0.12 or p >= 0.96 then return "mattina" end
  if p < 0.42 then return "giorno" end
  if p < 0.58 then return "sera" end
  return "notte"
end

local function giorno() return math.floor((time or 0) / 600 + 0.12) end

-- Uno stato che le rune pronunciate lasciano addosso al viandante (vedi core.effects).
local function addosso(user, nome)
  local st = ecs.get(user, "stati")
  return st and st[nome] and true or false
end

local function quartiere()
  local q = ecs.first("quartiere")
  return q, q and ecs.get(q, "quartiere")
end

local function dai(user, nome, n)
  local it = items.find(nome)
  if it then return inventory.add(user, it, n or 1) end
  return 0
end

function M.on_act(id, user, action)
  if action == "guarda" then
    local f = fase()
    if f == "notte" then
      if addosso(user, "nascosto") then return "Nascosto nella foschia, vedi tutto: un camion senza targa carica casse dal pozzo dello scavo, e due uomini in giacca contano. Uno ha una chiave con l’etichetta «Mag. 7»." end
      return "Di notte il cantiere dovrebbe essere vuoto. Invece c’è un camion senza targa col motore acceso. Qualcuno ti punta una torcia in faccia: meglio andarsene."
    end
    if f == "sera" then return "Gli operai smontano. Uno ti fa segno di passare oltre: «Qua non c’è niente da vedere»." end
    return "Uno scavo profondo, le pompe che tirano acqua, gli operai col caschetto. In fondo, tra la terra, pietre squadrate: sembra un molo antico."
  end
  if action == "scava" then
    local s = ecs.get(id, "scavato")
    if s then return "Terra, sassi e un tappo di bottiglia. Il resto l’hai già preso." end
    ecs.set(id, "scavato", { si = true })
    dai(user, "Coccio antico", 1)
    return "Tra la terra smossa trovi un coccio liscio, col bordo di un’anfora. Lo infili in tasca prima che ti vedano."
  end
  if action == "segna" then
    return "Disegni una freccia col gessetto sulla transenna. Domani qualcuno la seguirà, o la cancellerà."
  end
  return nil
end

return M
