-- Il lavoro (T245b): la giornata di chi ha un mestiere, compito per compito.
-- Il kernel mette il componente `mestiere` a ogni fase del giorno: i compiti della fase e i posti (casa, piazza, lavoro).
-- Qui ogni comportamento è una funzione (id, compito, stato, mestiere, pos, dt) che dice "finito", "continua" o "fallito".
-- Lo stato del compito in corso sta nel componente `lavoro`; ciò che si porta addosso in `carico`.
-- Camminare lo fa sys.wander: qui si sceglie solo il prossimo punto della via (`meta`).
local M = {}

local ARRIVATO = 1.3
local VICINO_SOLIDO = 1.7

-- Fermo, a fare quello che fa (la posa la disegna il renderer).
local function ferma(id, posa)
  ecs.set(id, "attivita", { tipo = posa or "lavora", ferma = true })
end

-- Un passo verso (tx, ty): la meta di sys.wander è il prossimo punto della via. Vero se è arrivato.
local function cammina(id, p, tx, ty, solido)
  local dx, dy = tx - p.x, ty - p.y
  local d = math.sqrt(dx * dx + dy * dy)
  if d < (solido and VICINO_SOLIDO or ARRIVATO) then return true end
  local q = world.path(p.x, p.y, tx, ty) or { x = tx, y = ty }
  ecs.set(id, "meta", { x = q.x, y = q.y })
  ecs.set(id, "attivita", { tipo = "passeggia", ferma = false })
  return false
end

-- Dove: casa, lavoro, piazza (dal kernel), casella:<codice> (la più vicina).
local function posto(m, p, dove)
  if dove == "casa" or dove == "lavoro" or dove == "piazza" then return m[dove] end
  local codice = type(dove) == "string" and dove:match("^casella:(.+)$")
  if codice then
    local c = m.lavoro or p
    return world.find_tile(codice, c.x, c.y, 12)
  end
  return nil
end

local function carica(id, oggetto, n)
  local c = ecs.get(id, "carico") or {}
  c[oggetto] = (c[oggetto] or 0) + n
  ecs.set(id, "carico", c)
end

local function dice(id, compito, s)
  if compito.dice and not s.detto then
    world.speak(id, compito.dice)
    s.detto = true
  end
end

local B = {}

function B.vai(id, compito, s, m, p)
  local t = posto(m, p, compito.dove)
  if not t then return "fallito:nessun posto " .. tostring(compito.dove) end
  if cammina(id, p, t.x, t.y) then return "finito" end
  return "continua"
end

-- Una casella `da` vicino al lavoro diventa `a` dopo `durata` di lavoro; `quante` volte. Ciò che resta da fare è il mondo stesso.
local function cambia(id, compito, s, m, p, da, a, raccolto)
  if not s.x then
    local c = m.lavoro or p
    local t = world.find_tile(da, c.x, c.y, 8)
    if not t then
      -- Niente da fare qui: il compito è fatto per oggi.
      return "finito"
    end
    s.x, s.y = t.x, t.y
  end
  if world.tile(s.x, s.y) ~= da then
    s.x, s.y, s.fino = nil, nil, nil
    return "continua"
  end
  local solido = world.free(s.x, s.y, 0.3) == false
  if not s.fino then
    if not cammina(id, p, s.x, s.y, solido) then return "continua" end
    s.fino = time + (compito.durata or 10)
    dice(id, compito, s)
  end
  ferma(id, compito.posa)
  if time < s.fino then return "continua" end
  world.set_tile(s.x, s.y, a)
  if raccolto then carica(id, raccolto, 1) end
  s.fatti = (s.fatti or 0) + 1
  s.x, s.y, s.fino = nil, nil, nil
  if s.fatti >= (compito.quante or 1) then return "finito" end
  return "continua"
end

function B.trasforma(id, compito, s, m, p)
  return cambia(id, compito, s, m, p, compito.da, compito.a)
end

function B.raccogli(id, compito, s, m, p)
  return cambia(id, compito, s, m, p, compito.casella, compito.lascia or compito.casella, compito.oggetto)
end

-- Fermi, nella posa: senza durata fino alla fine della fase.
local function resta(posa)
  return function(id, compito, s)
    ferma(id, compito.posa or posa)
    dice(id, compito, s)
    if not compito.durata then return "continua" end
    s.fino = s.fino or (time + compito.durata)
    if time < s.fino then return "continua" end
    return "finito"
  end
end
B.riposa = resta("dorme")
B.mangia = resta("mangia")
B.prega = resta("prega")
B.chiacchiera = resta("chiacchiera")
B.aspetta = resta("lavora")

function B.pattuglia(id, compito, s, m, p)
  local giro = compito.percorso or {}
  if #giro == 0 then return "finito" end
  s.tappa = s.tappa or 1
  local t = posto(m, p, giro[s.tappa])
  if not t or cammina(id, p, t.x, t.y) then s.tappa = s.tappa % #giro + 1 end
  return "continua"
end

-- I comportamenti che vengono dopo (porta, prendi, produci, usa, costruisci): finché non ci sono, il compito si salta.
local function dopo() return "finito" end
B.porta, B.prendi, B.produci, B.usa, B.costruisci = dopo, dopo, dopo, dopo, dopo

M.comportamenti = B

function M.update(dt)
  ecs.each("mestiere, pos", function(id, m, p)
    local mind = ecs.get(id, "mind")
    if mind and mind.mode ~= "vaga" then return end
    local s = ecs.get(id, "lavoro")
    if not s or s.fase ~= m.fase or s.giorno ~= m.giorno then
      s = { fase = m.fase, giorno = m.giorno, passo = 1 }
      ecs.set(id, "lavoro", s)
    end
    local compito = m.compiti and m.compiti[s.passo]
    if not compito then
      ferma(id, "chiacchiera")
      return
    end
    local f = B[compito.fa]
    local esito = f and f(id, compito, s, m, p, dt) or "fallito:comportamento sconosciuto"
    if esito ~= "continua" then
      if esito ~= "finito" then s.motivo = esito end
      s.passo = s.passo + 1
      s.x, s.y, s.fino, s.fatti, s.detto, s.tappa = nil, nil, nil, nil, nil, nil
    end
  end)
end

return M
