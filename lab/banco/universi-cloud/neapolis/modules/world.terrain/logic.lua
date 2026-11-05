-- Terreno di Neapolis.
-- generate_chunk restituisce size*size codici di tile, riga per riga.
-- Deterministico: stesso seme, stesse coordinate, stessa città. È solo una BOZZA continua: gli ambienti
-- (palazzi, banchine, giardini) la trasformano. Codici: g marciapiede, p strada, t platani, w acqua,
-- r scogli, s spiaggia, o mare, k tufo del colle, n brecciolino.
local M = {}

local function smooth(t) return t * t * (3 - 2 * t) end
local function lerp(a, b, t) return a + (b - a) * t end

local function vnoise(C, x, y, s)
  local ix, iy = math.floor(x), math.floor(y)
  local fx, fy = smooth(x - ix), smooth(y - iy)
  local function at(i, j)
    local k = i * 1000003 + j + s * 7919
    local v = C[k]
    if not v then v = hash(i, j, s); C[k] = v end
    return v
  end
  return lerp(lerp(at(ix, iy), at(ix + 1, iy), fx), lerp(at(ix, iy + 1), at(ix + 1, iy + 1), fx), fy)
end

-- Il mare sta a sud: la costa ondeggia piano attorno alla riga 46.
local function costa(C, wx, seed)
  return 46 + (vnoise(C, wx / 20, 0.5, seed + 5) - 0.5) * 6
end

local function tile_at(C, wx, wy, seed)
  -- La piazza di partenza è sempre sgombra.
  if wx > -4 and wx < 4 and wy > -4 and wy < 4 then return "g" end
  local c = costa(C, wx, seed)
  if wy > c + 4 then return "o" end
  if wy > c then
    if hash(wx, wy, seed + 3) < 0.08 then return "r" end
    return "w"
  end
  if wy > c - 3 then return "s" end
  -- Il colle a nord: tufo, pini e brecciolino.
  if wy < -30 then
    local h = vnoise(C, wx / 9, wy / 9, seed + 11)
    if h > 0.72 then return "k" end
    if h > 0.55 then return "t" end
    if hash(wx, wy, seed + 9) < 0.15 then return "n" end
    return "g"
  end
  -- Il reticolo delle strade: una ogni nove caselle, con i platani ai bordi.
  local mx, my = wx % 9, wy % 9
  if mx == 0 or my == 0 then return "p" end
  if (mx == 1 or my == 1) and hash(wx, wy, seed + 17) < 0.12 then return "t" end
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
