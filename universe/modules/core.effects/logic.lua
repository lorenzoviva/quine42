-- Effetti: il Concilio sceglie da un insieme chiuso, il kernel li valida, qui accadono.
-- apply(bersaglio, chi, effetto, x, y) restituisce una frase (o nil). x, y: dove accade, se non c'è un bersaglio.
local M = {}

local BISOGNI = { fame = "hunger", sete = "thirst", energia = "energy", salute = "health" }

local function clamp(v) return math.max(0, math.min(100, v)) end

local function dove(target, x, y)
  local p = target and ecs.get(target, "pos")
  if p then return p.x, p.y end
  if x and y then return x, y end
  local pp = world.player_pos()
  return pp.x, pp.y
end

local F = {}

function F.messaggio(_, _, e) return e.testo end

function F.bisogni(_, user, e)
  local n = ecs.get(user, "needs")
  if not n then return nil end
  for k, campo in pairs(BISOGNI) do
    if e[k] then n[campo] = clamp(n[campo] + e[k]) end
  end
  return nil
end

function F.crea_oggetto(target, _, e, x, y)
  local px, py = dove(target, x, y)
  for i = 1, (e.quantita or 1) do
    world.spawn(e.oggetto, px + (hash(i, 7) - 0.5) * 0.8, py + 0.4 + (hash(i, 9) - 0.5) * 0.4)
  end
  local d = items.def(e.oggetto)
  return d and ("Compare: " .. d.name .. ".") or nil
end

function F.consuma(_, user, e)
  inventory.remove(user, e.oggetto, e.quantita or 1)
  return nil
end

function F.distruggi(target)
  if target then world.break_entity(target) end
  return nil
end

function F.apri(target)
  if target and world.open(target) then return nil end
  return "Non c'è niente da aprire."
end

function F.contenitore(target, _, e)
  if target then world.make_container(target, e.capienza or 6, e.bottino or "cassa") end
  return nil
end

function F.terreno(target, _, e, x, y)
  local px, py = dove(target, x, y)
  local cx, cy = math.floor(px), math.floor(py)
  local r = e.raggio or 1
  for dy = -r, r do
    for dx = -r, r do
      if dx * dx + dy * dy <= r * r + r then
        if not e.da or world.tile(cx + dx, cy + dy) == e.da then world.set_tile(cx + dx, cy + dy, e.a) end
      end
    end
  end
  return nil
end

function F.fuoco(target, _, e, x, y)
  local px, py = dove(target, x, y)
  local r = e.raggio or 1
  ecs.spawn({
    pos = { x = px, y = py },
    glyph = { ch = "✶", color = "#ff8a2a", scale = 0.9 },
    fuoco = { raggio = r },
    luce = { raggio = r * 2 + 2, colore = "#ffb060", accesa = true },
    effimero = { fino = time + (e.durata or 10) },
  })
  return nil
end

function F.luce(target, _, e, x, y)
  local px, py = dove(target, x, y)
  ecs.spawn({
    pos = { x = px, y = py },
    glyph = { ch = "✧", color = "#fff3b0", scale = 0.6 },
    luce = { raggio = e.raggio or 4, colore = "#fff3b0", accesa = true },
    effimero = { fino = time + (e.durata or 60) },
  })
  return nil
end

function F.scudo(_, user, e)
  ecs.set(user, "scudo", { fino = time + (e.durata or 20) })
  return nil
end

function F.spingi(target, user, e)
  local p = target and ecs.get(target, "pos")
  local b = target and ecs.get(target, "body")
  if not p then return nil end
  local u = world.player_pos()
  local dx, dy = p.x - u.x, p.y - u.y
  local d = math.sqrt(dx * dx + dy * dy)
  if d < 0.01 then dx, dy, d = 0, 1, 1 end
  local r = (b and b.r) or 0.3
  local passi = math.floor((e.forza or 3) * 4)
  for _ = 1, passi do
    local nx, ny = p.x + dx / d * 0.25, p.y + dy / d * 0.25
    if not world.free(nx, ny, r) then break end
    p.x, p.y = nx, ny
  end
  return nil
end

-- Uno stato del viandante: a cavallo, in barca, con lo zaino. Cambia velocità, peso, luce.
function F.stato(_, user, e)
  local st = ecs.get(user, "stati") or {}
  st[e.nome] = { velocita = e.velocita or 1, peso = e.peso or 0, luce = e.luce or 0, fino = (e.durata or 0) > 0 and (time + e.durata) or 0 }
  ecs.set(user, "stati", st)
  return nil
end

function F.togli_stato(_, user, e)
  local st = ecs.get(user, "stati")
  if st then st[e.nome] = nil end
  return nil
end

function F.evoca(target, _, e, x, y)
  local px, py = dove(target, x, y)
  world.spawn(e.modulo, px + 0.8, py + 0.3)
  return nil
end

function M.apply(target, user, e, x, y)
  local f = F[e.tipo]
  if not f then return nil end
  return f(target, user, e, x, y)
end

return M
