-- Reattore a fusione: il carico sale con i prelievi e scende spurgando le valvole. Stato nel componente "reattore".
local M = {}

local function r(id)
  local s = ecs.get(id, "reattore")
  if not s then s = { carico = 60, spurgo = 0 }; ecs.set(id, "reattore", s) end
  return s
end

function M.on_act(id, user, action)
  local s = r(id)
  if action == "controlla" then
    local st = ecs.get(user, "stati")
    if st and st["sospeso"] then return "Nella stasi il nucleo sembra fermo: un respiro azzurro che dura un'eternità." end
    if s.carico > 85 then return "Il nucleo è bianco e ronza forte: carico " .. math.floor(s.carico) .. ". Le valvole vanno spurgate, subito." end
    if s.carico > 60 then return "Il nucleo pulsa azzurro, regolare: carico " .. math.floor(s.carico) .. ". Lavora bene." end
    return "Il nucleo è calmo, quasi pigro: carico " .. math.floor(s.carico) .. ". Si potrebbe prelevare plasma."
  end
  if action == "spurga" then
    s.carico = math.max(20, s.carico - 30)
    s.spurgo = time
    local l = ecs.get(id, "luce")
    if l then l.raggio = 3 end
    return "Le valvole sfiatano vapore con un fischio lungo; il nucleo si calma e la luce si abbassa."
  end
  if action == "preleva" then
    if s.carico < 40 then return "Il nucleo è troppo basso: prelevare adesso lo spegnerebbe. Lascialo riprendere." end
    if s.carico > 90 then return "Le mani tremano: il nucleo è troppo carico per aprire il condotto. Prima spurga le valvole." end
    s.carico = s.carico - 15
    inventory.add(user, items.find("Bottiglia di plasma"), 1)
    return "Apri il condotto con cautela: una bottiglia di plasma azzurro si riempie e si sigilla da sola."
  end
  if action == "salda" then
    inventory.remove(user, items.find("Cella energetica"), 1)
    s.carico = math.min(100, s.carico + 5)
    return "Posi la cella davanti al nucleo, come si usa a Sidera: la luce del plasma fa da testimone. Il debito è saldato."
  end
end

function M.on_spawn(id)
  local s = r(id)
  s.carico = 50 + math.floor(hash(id, 3) * 30)
end

return M
