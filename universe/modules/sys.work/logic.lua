-- Il lavoro (T245b): la giornata di chi ha un mestiere, compito per compito.
-- Il kernel mette il componente `mestiere` a ogni fase del giorno: i compiti della fase e i posti (home, square, work).
-- Qui ogni comportamento è una funzione (id, compito, stato, mestiere, pos, dt) che dice "done", "ongoing" o "failed:<motivo>".
-- Lo stato del compito in corso sta nel componente `lavoro`; ciò che si porta addosso in `carico`.
-- Camminare lo fa sys.wander: qui si sceglie solo il prossimo punto della via (`meta`).
local M = {}

local ARRIVATO = 1.3
local VICINO_SOLIDO = 1.7

-- Fermo, a fare quello che fa (la posa la disegna il renderer).
local function ferma(id, posa)
  ecs.set(id, "attivita", { tipo = posa or "work", ferma = true })
  -- Fermo perché lavora, non perché è bloccato: il conto del cammino riparte.
  local s = ecs.get(id, "lavoro")
  if s then s.px, s.py, s.dal = nil, nil, nil end
end

-- Chi non si muove da un po': vicino alla meta è arrivato (un muro di una forma, che la via sulle caselle non vede, la tiene
-- a un passo); lontano è bloccato, e il compito fallisce con il motivo.
local VICINO_FERMO = 3
local FERMO = 2
local BLOCCATO = 8

local function fermo(id, p, d)
  local s = ecs.get(id, "lavoro")
  if not s then return false end
  if not s.px or math.abs(p.x - s.px) + math.abs(p.y - s.py) >= 0.05 then
    s.px, s.py, s.dal = p.x, p.y, time
  end
  local da = time - (s.dal or time)
  if da >= BLOCCATO then s.bloccato = true end
  return d < VICINO_FERMO and da >= FERMO
end

-- How far a way is looked for (world.path looks no farther): beyond, one walks straight.
local MAX_WAY = 60

-- Un passo verso (tx, ty): la meta di sys.wander è il prossimo punto della via. Vero se è arrivato.
-- T299: the way is for a body as large as this one; with no way (nor one near the goal) nobody pushes at the wall: the task fails at
-- once, and the day goes on with the next one.
local function cammina(id, p, tx, ty, solido)
  local dx, dy = tx - p.x, ty - p.y
  local d = math.sqrt(dx * dx + dy * dy)
  if d < (solido and VICINO_SOLIDO or ARRIVATO) or fermo(id, p, d) then return true end
  local b = ecs.get(id, "body")
  local q = world.path(p.x, p.y, tx, ty, b and b.r)
  if not q then
    if d <= MAX_WAY then
      local s = ecs.get(id, "lavoro")
      if s then s.no_way = true end
    end
    q = { x = tx, y = ty }
  end
  ecs.set(id, "meta", { x = q.x, y = q.y })
  ecs.set(id, "attivita", { tipo = "stroll", ferma = false })
  return false
end

-- Dove: home, work, square (dal kernel), venture (il cantiere), tile:<codice> (la più vicina).
local function posto(m, p, dove)
  if dove == "home" or dove == "work" or dove == "square" then return m[dove] end
  if dove == "venture" then return m.impresa_posto end
  local codice = type(dove) == "string" and dove:match("^tile:(.+)$")
  if codice then
    local c = m.work or p
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
  if compito.says and not s.detto then
    world.speak(id, compito.says)
    s.detto = true
  end
end

local B = {}

function B.go(id, compito, s, m, p)
  local t = posto(m, p, compito.where)
  if not t then return "failed:no_place:" .. tostring(compito.where) end
  if cammina(id, p, t.x, t.y) then return "done" end
  return "ongoing"
end

-- Una casella `da` vicino al lavoro diventa `a` dopo `durata` di lavoro; `quante` volte. Ciò che resta da fare è il mondo stesso.
local function cambia(id, compito, s, m, p, da, a, raccolto)
  if not s.x then
    local c = m.work or p
    local t = world.find_tile(da, c.x, c.y, 8)
    if not t then
      -- Niente da fare qui: il compito è fatto per oggi.
      return "done"
    end
    s.x, s.y = t.x, t.y
  end
  if world.tile(s.x, s.y) ~= da then
    s.x, s.y, s.fino = nil, nil, nil
    return "ongoing"
  end
  local solido = world.free(s.x, s.y, 0.3) == false
  if not s.fino then
    if not cammina(id, p, s.x, s.y, solido) then return "ongoing" end
    s.fino = time + (compito.duration or 10)
    dice(id, compito, s)
  end
  ferma(id, compito.pose)
  if time < s.fino then return "ongoing" end
  world.set_tile(s.x, s.y, a)
  if raccolto then carica(id, raccolto, 1) end
  s.fatti = (s.fatti or 0) + 1
  s.x, s.y, s.fino = nil, nil, nil
  if s.fatti >= (compito.count or 1) then return "done" end
  return "ongoing"
end

function B.transform(id, compito, s, m, p)
  return cambia(id, compito, s, m, p, compito.from, compito.to)
end

function B.gather(id, compito, s, m, p)
  return cambia(id, compito, s, m, p, compito.tile, compito.drop or compito.tile, compito.item)
end

-- Fermi, nella posa: senza durata fino alla fine della fase.
local function resta(posa)
  return function(id, compito, s)
    ferma(id, compito.pose or posa)
    dice(id, compito, s)
    if not compito.duration then return "ongoing" end
    s.fino = s.fino or (time + compito.duration)
    if time < s.fino then return "ongoing" end
    return "done"
  end
end
B.rest = resta("sleep")
B.eat = resta("eat")
B.pray = resta("pray")
B.chat = resta("chat")
B.wait = resta("work")

function B.patrol(id, compito, s, m, p)
  local giro = compito.route or {}
  if #giro == 0 then return "done" end
  s.tappa = s.tappa or 1
  local t = posto(m, p, giro[s.tappa])
  if not t or cammina(id, p, t.x, t.y) then s.tappa = s.tappa % #giro + 1 end
  return "ongoing"
end

-- Il deposito del luogo (T245c): ciò che i mestieri portano e prendono, nel magazzino di questo modulo, una chiave per luogo.
local function deposito_di(id)
  local m = ecs.get(id, "mestiere")
  if not m or type(m.luogo) ~= "string" then return nil end
  return "deposito:" .. m.luogo:gsub(",", ":")
end

local function deposita(id, oggetto, n)
  local k = deposito_di(id)
  if not k or n <= 0 then return false end
  local d = world.store_get(k) or {}
  d[oggetto] = (d[oggetto] or 0) + n
  return world.store_set(k, d)
end

-- Toglie dal deposito fino a n, e dice quanti.
local function preleva(id, oggetto, n)
  local k = deposito_di(id)
  if not k then return 0 end
  local d = world.store_get(k) or {}
  local preso = math.min(n, d[oggetto] or 0)
  if preso <= 0 then return 0 end
  d[oggetto] = d[oggetto] - preso
  if d[oggetto] <= 0 then d[oggetto] = nil end
  world.store_set(k, d)
  return preso
end

local function scarica(id, oggetto, n)
  local c = ecs.get(id, "carico") or {}
  local tolto = math.min(n, c[oggetto] or 0)
  c[oggetto] = (c[oggetto] or 0) - tolto
  if c[oggetto] <= 0 then c[oggetto] = nil end
  ecs.set(id, "carico", c)
  return tolto
end

-- Prima di ogni cosa da fare, il posto: per default il lavoro.
local function al_posto(id, compito, s, m, p)
  if s.arrivato then return true end
  local dove = compito.where or "work"
  local t
  local tag = type(dove) == "string" and dove:match("^entity:(.+)$")
  if tag then
    local e = world.nearest(p.x, p.y, 12, tag)
    if e then
      s.cosa = e
      t = ecs.get(e, "pos")
    end
  else
    t = posto(m, p, dove)
  end
  if not t then return nil end
  if cammina(id, p, t.x, t.y, tag ~= nil) then
    s.arrivato = true
    return true
  end
  return false
end

-- Porta ciò che ha al deposito del luogo (o dentro la cosa, se ha una tasca): tutto in una volta.
function B.carry(id, compito, s, m, p)
  local c = ecs.get(id, "carico") or {}
  if (c[compito.item] or 0) <= 0 then return "done" end
  local qui = al_posto(id, compito, s, m, p)
  if qui == nil then return "failed:no_place" end
  if not qui then return "ongoing" end
  local n = c[compito.item]
  if s.cosa and inventory.add(s.cosa, compito.item, n) > 0 then
    scarica(id, compito.item, n)
  elseif deposita(id, compito.item, n) then
    scarica(id, compito.item, n)
  else
    return "failed:deposit_full"
  end
  ferma(id, compito.pose or "work")
  dice(id, compito, s)
  return "done"
end

-- Prende dal deposito del luogo.
function B.take(id, compito, s, m, p)
  local qui = al_posto(id, compito, s, m, p)
  if qui == nil then return "failed:no_place" end
  if not qui then return "ongoing" end
  local n = preleva(id, compito.item, compito.count or 1)
  if n <= 0 then return "failed:missing:" .. compito.item end
  carica(id, compito.item, n)
  dice(id, compito, s)
  return "done"
end

-- Al banco (il posto), con ciò che serve (`con`: da ciò che porta, o dal deposito), dopo `durata` di lavoro: una cosa in più.
function B.produce(id, compito, s, m, p)
  local qui = al_posto(id, compito, s, m, p)
  if qui == nil then return "failed:no_place" end
  if not qui then return "ongoing" end
  if not s.fino then
    if compito.with and scarica(id, compito.with, 1) < 1 and preleva(id, compito.with, 1) < 1 then
      if (s.fatti or 0) > 0 then return "done" end
      return "failed:missing:" .. compito.with
    end
    s.fino = time + (compito.duration or 10)
    dice(id, compito, s)
  end
  ferma(id, compito.pose or "work")
  if time < s.fino then return "ongoing" end
  carica(id, compito.item, 1)
  s.fatti = (s.fatti or 0) + 1
  s.fino = nil
  if s.fatti >= (compito.count or 1) then return "done" end
  return "ongoing"
end

-- Usa una cosa come il viandante con «Usa»: il suo on_act, con l'individuo come chi la usa.
function B.use(id, compito, s, m, p)
  local qui = al_posto(id, compito, s, m, p)
  if qui == nil then return "failed:nothing_to_use" end
  if not qui then return "ongoing" end
  if not s.fino then
    s.fino = time + (compito.duration or 5)
    s.usato = world.act(id, s.cosa, compito.action) ~= nil
    dice(id, compito, s)
  end
  ferma(id, compito.pose or "work")
  if time < s.fino then return "ongoing" end
  return "done"
end

-- Costruire (T245d): il prossimo passo dell'impresa lo dice il kernel (world.impresa). Portare un materiale (dal carico, o prima
-- dal deposito del luogo, in piazza), lavorare al cantiere, mietere. Finché c'è un passo il compito continua; senza, si torna al mestiere.
-- Il lavoro lo conta il kernel guardando chi sta fermo al cantiere: qui non si scrive nessun numero.
function B.build(id, compito, s, m, p, dt)
  local passo = world.impresa(id)
  if not passo then return "done" end
  if s.passo_fa ~= passo.does or s.oggetto ~= passo.item then
    s.passo_fa, s.oggetto, s.x, s.y, s.fino, s.fatti, s.preso = passo.does, passo.item, nil, nil, nil, nil, nil
  end
  if passo.does == "carry" then
    local c = ecs.get(id, "carico") or {}
    if (c[passo.item] or 0) <= 0 then
      -- Al deposito del luogo, in piazza.
      local t = m.square or p
      if not cammina(id, p, t.x, t.y) then return "ongoing" end
      local n = preleva(id, passo.item, 2)
      if n <= 0 then return "done" end
      carica(id, passo.item, n)
      return "ongoing"
    end
    if not cammina(id, p, passo.x, passo.y, true) then return "ongoing" end
    if world.impresa_porta(id, passo.item) <= 0 then return "done" end
    dice(id, compito, s)
    return "ongoing"
  end
  if passo.does == "gather" then
    local esito = cambia(id, passo, s, { work = { x = passo.x, y = passo.y } }, p, passo.tile, passo.drop, passo.item)
    if esito == "done" and (s.fatti or 0) == 0 then return "done" end
    if esito == "done" then s.fatti = 0 end
    return "ongoing"
  end
  -- Lavorare: al proprio posto attorno al cantiere, fermi nella posa.
  if not s.fino then
    if not cammina(id, p, passo.x, passo.y) then return "ongoing" end
    s.fino = true
  end
  ferma(id, passo.pose or "work")
  dice(id, compito, s)
  return "ongoing"
end

-- Il pannello del cantiere (T245d): il pulsante porta ciò che serve dalla borsa del viandante, se è vicino al cantiere.
function M.on_ui(user, azione)
  if azione ~= "porta" then return nil end
  local n = world.impresa_porta(user)
  if n > 0 then return "Lasci al cantiere " .. n .. " cose che servivano." end
  return "Al cantiere qui vicino non serve niente di ciò che porti (o sei troppo lontano)."
end

M.comportamenti = B

function M.update(dt)
  ecs.each("mestiere, pos", function(id, m, p)
    local mind = ecs.get(id, "mind")
    if mind and mind.mode ~= "vaga" then return end
    local s = ecs.get(id, "lavoro")
    if not s or s.fase ~= m.fase or s.giorno ~= m.giorno or s.impresa ~= m.impresa then
      ecs.set(id, "lavoro", { fase = m.fase, giorno = m.giorno, impresa = m.impresa, passo = 1 })
      -- ecs.set copia: ciò che il compito scrive va nella tabella del componente, quella che si rilegge.
      s = ecs.get(id, "lavoro")
    end
    local compito = m.compiti and m.compiti[s.passo]
    if not compito then
      ferma(id, "chat")
      return
    end
    local f = B[compito.does]
    local esito = f and f(id, compito, s, m, p, dt) or "failed:unknown_behaviour"
    if esito == "ongoing" and s.no_way then esito = "failed:no_way" end
    if esito == "ongoing" and s.bloccato then esito = "failed:unreachable" end
    if esito ~= "ongoing" then
      -- Il compito dopo comincia da capo: dello stato resta solo dove si è arrivati nella giornata, e l'ultimo motivo.
      ecs.set(id, "lavoro", { fase = s.fase, giorno = s.giorno, impresa = s.impresa, passo = s.passo + 1, motivo = esito ~= "done" and esito or s.motivo })
    end
  end)
end

return M
