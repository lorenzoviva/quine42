-- Terrain of Valmora.
-- generate_chunk returns size*size tile codes, row by row.
-- generate_relief returns size*size integer levels (and a second line of bed levels under water)
-- when the world's nature has true relief (T475, ADR-0256).
-- Deterministic: same seed, same coordinates, same world. It is only a continuous DRAFT:
-- the Cartographer uses it as a starting point and transforms it. Codes of the draft: g p t w r (base),
-- s sand, j jungle, o sea, k mountain, n snow (biomes).
local M = {}

local function smooth(t) return t * t * (3 - 2 * t) end
local function lerp(a, b, t) return a + (b - a) * t end
local function clamp(v, lo, hi)
  if v < lo then return lo end
  if v > hi then return hi end
  return v
end
local function smoothstep(a, b, v)
  return smooth(clamp((v - a) / (b - a), 0, 1))
end

-- C: cache of the lattice values, it lives only for the length of one call (no state).
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

-- Pure Lua 5.4 integer hash for the relief's own layers (avoids crossing the JS bridge per lattice point).
local function ihash(a, b, s)
  local h = 2166136261
  h = ((h ~ (a & 0xffffffff)) * 16777619) & 0xffffffff
  h = h ~ (h >> 13)
  h = (h * 0x5bd1e995) & 0xffffffff
  h = h ~ (h >> 15)
  h = ((h ~ (b & 0xffffffff)) * 16777619) & 0xffffffff
  h = h ~ (h >> 13)
  h = (h * 0x5bd1e995) & 0xffffffff
  h = h ~ (h >> 15)
  h = ((h ~ (s & 0xffffffff)) * 16777619) & 0xffffffff
  h = h ~ (h >> 13)
  h = (h * 0x5bd1e995) & 0xffffffff
  h = h ~ (h >> 15)
  return h / 4294967296
end

local function ilattice(C, ix, iy, s)
  local layer = C[s]
  if not layer then layer = {}; C[s] = layer end
  local k = ix * 1000003 + iy
  local v = layer[k]
  if not v then v = ihash(ix, iy, s); layer[k] = v end
  return v
end

local function inoise(C, x, y, s)
  local ix, iy = math.floor(x), math.floor(y)
  local dx, dy = x - ix, y - iy
  local fx, fy = dx * dx * (3 - 2 * dx), dy * dy * (3 - 2 * dy)
  local a, b = ilattice(C, ix, iy, s), ilattice(C, ix + 1, iy, s)
  local c, d = ilattice(C, ix, iy + 1, s), ilattice(C, ix + 1, iy + 1, s)
  local ab = a + (b - a) * fx
  return ab + (c + (d - c) * fx - ab) * fy
end

local function iridge(C, x, y, s)
  return 1 - math.abs(2 * inoise(C, x, y, s) - 1)
end

local function fbm(C, x, y, s)
  return vnoise(C, x / 24, y / 24, s) * 0.6 + vnoise(C, x / 9, y / 9, s + 1) * 0.3 + vnoise(C, x / 4, y / 4, s + 2) * 0.1
end

-- Large-scale biomes: temperature and humidity change slowly (tens of places), the continent
-- decides where the sea is. Near the origin the climate is mild: one starts from a temperate village.
local function bioma(C, wx, wy, seed)
  local d = math.min(1, math.sqrt(wx * wx + wy * wy) / 90)
  local temp = 0.5 + (vnoise(C, wx / 170, wy / 170, seed + 31) - 0.5) * 2 * d
  local umid = 0.5 + (vnoise(C, wx / 140, wy / 140, seed + 37) - 0.5) * 2 * d
  local cont = 0.5 + (vnoise(C, wx / 120, wy / 120, seed + 41) - 0.5) * 2 * d
  return temp, umid, cont
end

-- Large-scale true relief signal shared between generate_chunk (when nature.relief == "true") and generate_relief:
-- massifs with terraces and passes, gentle coastal slopes, and deep/shallow beds under water.
local function relief_at(C, wx, wy, seed, islands, cont_in, h_in, river_dist_in)
  local dist = math.sqrt(wx * wx + wy * wy)
  local cont = cont_in
  if not cont then
    if islands then
      cont = 0.5
    else
      local d = math.min(1, dist / 90)
      cont = 0.5 + (vnoise(C, wx / 120, wy / 120, seed + 41) - 0.5) * 2 * d
    end
  end

  -- Open sea: surface 0, deep bed below (with occasional reefs at -1).
  if not islands and cont < 0.24 then
    local reef = inoise(C, wx / 7, wy / 7, seed + 914) > 0.82
    local depth = reef and 1 or (8 + math.floor(20 * inoise(C, wx / 11, wy / 11, seed + 915) + 0.5))
    return -depth, -depth, 0
  end

  -- Starting square stays gentle and welcoming; massifs rise beyond it.
  local origin_fade = smoothstep(8, 28, dist)
  -- Coasts slope down toward the sea so sandy beaches meet the water smoothly.
  local coast_fade = islands and 1 or smoothstep(0.24, 0.34, cont)
  local massif_coast = islands and 1 or smoothstep(0.26, 0.38, cont)

  local hills = (inoise(C, wx / 28, wy / 28, seed + 901) * 5 + inoise(C, wx / 12, wy / 12, seed + 902) * 2) * coast_fade
  local m_noise = 0.65 * iridge(C, wx / 150, wy / 150, seed + 911) + 0.35 * inoise(C, wx / 50, wy / 50, seed + 912)
  local m = smoothstep(0.54, 0.85, m_noise) * origin_fade * massif_coast

  -- Terraced massif (8 levels per tier = 2 tiles, gentle slope inside, ~6-level climbable cliffs between tiers)
  -- softened along narrow mountain passes.
  local raw = m * 56
  local tier = math.floor(raw / 8)
  local terraced = tier * 8 + (raw - tier * 8) * 0.25
  local pass = smoothstep(0.90, 0.97, iridge(C, wx / 46, wy / 46, seed + 913))
  local lift = terraced + (raw - terraced) * pass
  local level = math.max(0, math.min(64, math.floor(hills + lift + 0.5)))

  -- Shallow water (coastal strip, rivers, ponds): surface stays continuous with its banks, bed lies 2..7 levels below.
  local river_dist = river_dist_in or math.abs(vnoise(C, wx / 55, wy / 55, seed + 17) - 0.5)
  local fiume = river_dist < 0.014
  local is_shallow = fiume
  local coastal_water = false
  if not is_shallow then
    local h = h_in or fbm(C, wx, wy, seed)
    coastal_water = not islands and cont < 0.28 and h < 0.45
    is_shallow = coastal_water or (h < 0.3)
  end
  if is_shallow then
    local surf = coastal_water and 0 or level
    local depth = 2 + math.floor(5 * inoise(C, wx / 11, wy / 11, seed + 915) + 0.5)
    return surf, math.max(-32, surf - depth), m
  end

  return level, level, m
end

local function tile_at(C, wx, wy, seed, islands, true_relief)
  -- The starting square is always clear.
  if wx > -3 and wx < 3 and wy > -3 and wy < 3 then return "g" end
  local h = fbm(C, wx, wy, seed)
  local m = fbm(C, wx, wy, seed + 7)
  local road = math.abs(vnoise(C, wx / 30, wy / 30, seed + 13) - 0.5) < 0.025
  local river_dist = math.abs(vnoise(C, wx / 55, wy / 55, seed + 17) - 0.5)
  local fiume = river_dist < 0.014
  local r = hash(wx, wy, seed + 3)
  local temp, umid, cont = bioma(C, wx, wy, seed)
  -- Open sea, then the sandy shore. In an archipelago the kernel draws the sea around its islands: inside them, land.
  if not islands then
    if cont < 0.24 then return "o" end
    if cont < 0.28 then return h < 0.45 and "w" or "s" end
  end
  if true_relief then
    if fiume then return "w" end
    if road then return "p" end
    local lv, _, massif = relief_at(C, wx, wy, seed, islands, cont, h, river_dist)
    -- In true relief, k is walkable bare mountain rock on massifs and ridges; snow caps the highest cold peaks.
    if massif > 0.35 or lv >= 24 then
      if lv >= 42 and temp < 0.55 then return "n" end
      if h > 0.78 and r < 0.25 then return "r" end
      return "k"
    end
  end
  if h > 0.8 then return "k" end
  if h > 0.73 then return "r" end
  if fiume then return "w" end
  if road then return "p" end
  if temp > 0.68 and umid < 0.42 then
    -- Desert: sand, a few rocks, rare oases.
    if h < 0.3 then return "w" end
    if r < 0.03 then return "r" end
    return "s"
  end
  if temp > 0.62 and umid > 0.6 then
    -- Jungle: very dense, with clearings.
    if h < 0.3 then return "w" end
    if m > 0.45 and r < 0.8 then return "j" end
    return "g"
  end
  if temp < 0.3 then
    -- Frozen north: snow and firs.
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
  local nature = world.nature()
  local islands = type(nature) == "table" and nature.geography == "archipelago"
  local true_relief = type(nature) == "table" and nature.relief == "true"
  for row = 0, size - 1 do
    for col = 0, size - 1 do
      out[#out + 1] = tile_at(C, cx * size + col, cy * size + row, seed, islands, true_relief)
    end
  end
  return table.concat(out)
end

-- Returns two lines of size*size comma-separated integers: surface/ground levels, then bed levels under water.
function M.generate_relief(cx, cy, seed, size)
  local levels, beds, C = {}, {}, {}
  local nature = world.nature()
  local islands = type(nature) == "table" and nature.geography == "archipelago"
  for row = 0, size - 1 do
    for col = 0, size - 1 do
      local lv, bd = relief_at(C, cx * size + col, cy * size + row, seed, islands)
      levels[#levels + 1] = lv
      beds[#beds + 1] = bd
    end
  end
  return table.concat(levels, ",") .. "\n" .. table.concat(beds, ",")
end

return M
