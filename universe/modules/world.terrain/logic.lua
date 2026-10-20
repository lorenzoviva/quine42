-- Terreno di Valmora.
-- generate_chunk restituisce size*size codici di tile, riga per riga.
-- Deterministico: stesso seme, stesse coordinate, stesso mondo. È solo una BOZZA continua:
-- il Cartografo la usa come punto di partenza e la trasforma. Codici della bozza: g p t w r (base),
-- s sabbia, j giungla, o mare, k montagna, n neve (biomi).
local M = {}

local function smooth(t) return t * t * (3 - 2 * t) end
local function lerp(a, b, t) return a + (b - a) * t end

-- C: cache dei valori del reticolo, vive solo per la durata di una chiamata (niente stato).
local function lattice(C, ix, iy, s)
  local layer = C[s]
  if not layer then layer = {}; C[s] = layer end
  local k = ix * 1000003 + iy
  local v = layer[k]
  if not v then v = hash(ix, iy, s); layer[k] = v end
  return v
end

local function vnoise(C, x, y, s)
  local ix, iy = math.floor(x), math.floor(y)
  local fx, fy = smooth(x - ix), smooth(y - iy)
  local a, b = lattice(C, ix, iy, s), lattice(C, ix + 1, iy, s)
  local c, d = lattice(C, ix, iy + 1, s), lattice(C, ix + 1, iy + 1, s)
  return lerp(lerp(a, b, fx), lerp(c, d, fx), fy)
end

local function fbm(C, x, y, s)
  return vnoise(C, x / 24, y / 24, s) * 0.6 + vnoise(C, x / 9, y / 9, s + 1) * 0.3 + vnoise(C, x / 4, y / 4, s + 2) * 0.1
end

-- Biomi su larga scala: temperatura e umidità cambiano lentamente (decine di luoghi), il continente
-- decide dove c'è il mare. Vicino all'origine il clima è mite: si parte da un borgo temperato.
local function bioma(C, wx, wy, seed)
  local d = math.min(1, math.sqrt(wx * wx + wy * wy) / 90)
  local temp = 0.5 + (vnoise(C, wx / 170, wy / 170, seed + 31) - 0.5) * 2 * d
  local umid = 0.5 + (vnoise(C, wx / 140, wy / 140, seed + 37) - 0.5) * 2 * d
  local cont = 0.5 + (vnoise(C, wx / 120, wy / 120, seed + 41) - 0.5) * 2 * d
  return temp, umid, cont
end

local function tile_at(C, wx, wy, seed)
  -- La piazza di partenza è sempre sgombra.
  if wx > -3 and wx < 3 and wy > -3 and wy < 3 then return "g" end
  local h = fbm(C, wx, wy, seed)
  local m = fbm(C, wx, wy, seed + 7)
  local road = math.abs(vnoise(C, wx / 30, wy / 30, seed + 13) - 0.5) < 0.025
  local fiume = math.abs(vnoise(C, wx / 55, wy / 55, seed + 17) - 0.5) < 0.014
  local r = hash(wx, wy, seed + 3)
  local temp, umid, cont = bioma(C, wx, wy, seed)
  -- Mare aperto, poi la riva di sabbia.
  if cont < 0.24 then return "o" end
  if cont < 0.28 then return h < 0.45 and "w" or "s" end
  if h > 0.8 then return "k" end
  if h > 0.73 then return "r" end
  if fiume then return "w" end
  if road then return "p" end
  if temp > 0.68 and umid < 0.42 then
    -- Deserto: sabbia, qualche roccia, rare oasi.
    if h < 0.3 then return "w" end
    if r < 0.03 then return "r" end
    return "s"
  end
  if temp > 0.62 and umid > 0.6 then
    -- Giungla: fittissima, con radure.
    if h < 0.3 then return "w" end
    if m > 0.45 and r < 0.8 then return "j" end
    return "g"
  end
  if temp < 0.3 then
    -- Nord gelido: neve e abeti.
    if h < 0.3 then return "w" end
    if m > 0.6 and r < 0.5 then return "t" end
    return "n"
  end
  if h < 0.3 then return "w" end
  if m > 0.62 then
    if r < 0.55 then return "t" end
    return "g"
  end
  return "g"
end

function M.generate_chunk(cx, cy, seed, size)
  local out, C = {}, {}
  for row = 0, size - 1 do
    for col = 0, size - 1 do
      out[#out + 1] = tile_at(C, cx * size + col, cy * size + row, seed)
    end
  end
  return table.concat(out)
end

return M
