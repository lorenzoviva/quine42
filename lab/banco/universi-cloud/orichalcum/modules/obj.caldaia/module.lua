-- Caldaia a pressione: carbone e acqua dentro, fuoco, pressione. Il sistema sys.pressione la fa vivere.
local M = {}

local function stato(c)
  local p = math.floor((c.pressione or 0) * 10 + 0.5) / 10
  local fuoco = c.accesa and "il fuoco ruggisce" or "il fuoco è spento"
  return string.format("Carbone %d, acqua %d, %s; la lancetta segna %.1f atmosfere.", math.floor(c.carbone or 0), math.floor(c.acqua or 0), fuoco, p)
end

function M.on_interact(id, user)
  local c = ecs.get(id, "caldaia")
  if not c then return "Una caldaia fredda." end
  return stato(c)
end

function M.on_act(id, user, action)
  local c = ecs.get(id, "caldaia")
  if not c then return "La caldaia non risponde." end
  if action == "carbone" then
    local n = inventory.remove(user, "item.carbone", 3)
    if n <= 0 then return "Non hai carbone." end
    c.carbone = (c.carbone or 0) + n * 4
    return "Spali " .. n .. " pezzi di carbone nel portello. " .. stato(c)
  elseif action == "acqua" then
    local n = inventory.remove(user, "item.acqua-termale", 1)
    if n <= 0 then return "Non hai acqua." end
    c.acqua = (c.acqua or 0) + 10
    return "L'acqua gorgoglia nel serbatoio. " .. stato(c)
  elseif action == "accendi" then
    if (c.acqua or 0) <= 0 then return "Una caldaia senz'acqua non si accende: scoppierebbe. Prima l'acqua." end
    if (c.carbone or 0) <= 0 then return "Non c'è carbone da accendere." end
    if c.accesa then return "È già accesa. " .. stato(c) end
    c.accesa = true
    local st = ecs.get(user, "stati")
    if st and st["passo a molla"] then return "Accendi il fuoco e salti indietro con un balzo leggero, prima che la vampata ti arrivi." end
    return "Il fuoco prende con un ruggito. La lancetta comincia a salire."
  elseif action == "sfiata" then
    local prima = c.pressione or 0
    c.pressione = math.max(0, prima - 4)
    if prima < 1 then return "Lo sfiato soffia appena: non c'è pressione." end
    local st = ecs.get(user, "stati")
    if st and st["tempra d'ottone"] then return "Il getto di vapore ti investe, ma la pelle d'ottone non sente il caldo. " .. stato(c) end
    return "FSSSS! Un getto di vapore bianco sale dritto verso il cielo. " .. stato(c)
  elseif action == "batti" then
    if c.battuta then return "L'hai già battuta tre volte: la caldaia conosce il suo nome." end
    c.battuta = true
    return "Tan, tan, tan. Dici il nome di chi l'ha fatta, come si usa, e il ferro risponde con un ronzio basso."
  elseif action == "ascolta" then
    local p = c.pressione or 0
    if not c.accesa then return "Silenzio, e un ticchettio di metallo che si raffredda." end
    if p > 9 then return "Fischia forte: la pressione è alta. Meglio aprire lo sfiato." end
    if p > 4 then return "Un brontolio regolare, come una pentola che bolle contenta." end
    return "Un respiro lento: la pressione sta salendo."
  end
  return stato(c)
end

return M
