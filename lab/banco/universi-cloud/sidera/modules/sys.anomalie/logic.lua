-- Pozze di gravità e risonanza. Tutto ciò che serve ricordare vive nel componente "anomalia" del viandante.
-- Le condizioni delle rune si leggono per nome dal componente "stati" (mai iterandolo: è una tabella del kernel).
local M = {}

local function vicino(px, py, codice, r)
  local n = 0
  for dy = -r, r do
    for dx = -r, r do
      if world.tile(px + dx, py + dy) == codice then n = n + 1 end
    end
  end
  return n
end

local function dici(a, chiave, testo)
  -- Al più un messaggio ogni venti secondi, e mai lo stesso due volte di fila.
  if time < (a.prossimo or 0) or a.ultimo == chiave then return end
  a.prossimo = time + 20
  a.ultimo = chiave
  world.say(testo)
end

function M.update(dt)
  local id = world.player()
  if not id then return end
  local p = ecs.get(id, "pos")
  local n = ecs.get(id, "needs")
  if not p or not n then return end
  local a = ecs.get(id, "anomalia")
  if not a then
    a = { prossimo = 0, ultimo = "", conto = 0 }
    ecs.set(id, "anomalia", a)
  end
  -- Controllare il suolo costa: dieci volte al secondo basta.
  a.conto = (a.conto or 0) + dt
  if a.conto < 0.1 then return end
  local passo = a.conto
  a.conto = 0
  local st = ecs.get(id, "stati")
  local zavorrato = st and st["zavorrato"]
  local alleggerito = st and st["alleggerito"]
  local sospeso = st and st["sospeso"]
  local intirizzito = st and st["intirizzito"]
  local cristalli = vicino(p.x, p.y, "r", 1)
  local brina = world.tile(p.x, p.y) == "n"
  if cristalli > 0 then
    -- La risonanza: la forza interiore torna più in fretta, più ancora se si è leggeri.
    local guadagno = (alleggerito and 1.2 or 0.6) * cristalli * passo
    n.mana = math.min(100, (n.mana or 0) + guadagno)
    dici(a, "cristalli", "Gli speroni di cristallo vibrano piano: senti la forza interiore tornare, come un formicolio alle dita.")
  end
  if brina and not zavorrato then
    n.energy = math.max(0, n.energy - 0.4 * passo)
    dici(a, "brina", "Sulla brina i piedi scivolano: ogni passo costa il doppio.")
  end
  if intirizzito then
    n.energy = math.max(0, n.energy - 0.3 * passo)
    dici(a, "gelo", "Il gelo del vuoto ti è rimasto nelle ossa.")
  end
  if sospeso then
    n.health = math.min(100, n.health + 1.5 * passo)
    dici(a, "stasi", "Nella stasi il cuore batte lentissimo, e il corpo si ripara.")
  end
  if zavorrato and brina then dici(a, "ancora", "Gravis ti tiene a terra: sulla brina non scivoli.") end
end

return M
