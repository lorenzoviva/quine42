-- Terreno di Sidera.
-- generate_chunk restituisce size*size codici di casella, riga per riga.
-- Deterministico: stesso seme, stesse coordinate, stesse terre. È una BOZZA continua:
-- gli ambienti la trasformano in quartieri, cupole, piste e cantieri.
-- Codici: g asfalto, p passerella, t boschetto di vetro, w canale, r cristalli,
-- s sabbia vitrea, j felceto, o mare, k basalto, n brina.
local M = {}

local function smooth(t) return t * t * (3 - 2 * t) end
local function lerp(a, b, t) return a + (b - a) * t end

-- C: cache del reticolo, vive solo per una chiamata (niente stato tra una chiamata e l'altra).
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
  return vnoise(C, x / 22, y / 22, s) * 0.6 + vnoise(C, x / 8, y / 8, s + 1) * 0.3 + vnoise(C, x / 3, y / 3, s + 2) * 0.1
end

-- Quanto si è lontani dalla città: vicino al centro è tutto asfalto e canali, fuori le terre si fanno strane.
local function fuori(wx, wy)
  return math.min(1, math.sqrt(wx * wx + wy * wy) / 200)
end

local function tile_at(C, wx, wy, seed)
  -- La piazza dei viadotti è sempre sgombra.
  if wx > -3 and wx < 3 and wy > -3 and wy < 3 then return "p" end
  local h = fbm(C, wx, wy, seed)
  local m = fbm(C, wx, wy, seed + 7)
  local r = hash(wx, wy, seed + 3)
  local d = fuori(wx, wy)
  local strada = math.abs(vnoise(C, wx / 26, wy / 26, seed + 13) - 0.5) < 0.03
  local canale = math.abs(vnoise(C, wx / 48, wy / 48, seed + 17) - 0.5) < 0.016
  local freddo = vnoise(C, wx / 150, wy / 150, seed + 31)
  local costa = 0.5 + (vnoise(C, wx / 120, wy / 120, seed + 41) - 0.5) * 2 * d
  -- Il mare si è preso la costa: prima il mare, poi la sabbia vitrea della riva.
  if costa < 0.22 then return "o" end
  if costa < 0.27 then return h < 0.45 and "w" or "s" end
  if h > 0.82 then return "k" end
  if canale then return "w" end
  if strada then return "p" end
  -- In città: asfalto, qualche boschetto nei giardini pensili, cristalli solo dove la terra si alza.
  if d < 0.3 then
    if h > 0.74 then return "r" end
    if m > 0.68 and r < 0.5 then return "t" end
    if r < 0.04 then return "w" end
    return "g"
  end
  -- Fuori città: le terre fredde con la brina, i canyon di cristallo, le distese di vetro, i felceti.
  if freddo < 0.32 then
    if h > 0.68 then return "r" end
    if m > 0.64 and r < 0.4 then return "t" end
    return "n"
  end
  if h > 0.66 then
    if r < 0.6 then return "r" end
    return "s"
  end
  if m > 0.6 then
    if r < 0.6 then return "j" end
    return "g"
  end
  if m < 0.3 then return "s" end
  if r < 0.03 then return "r" end
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
