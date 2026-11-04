-- Il cantiere: una casa 5 × 5 che cresce per passi coerenti. Prima la platea di pietra, poi i muri, poi la porta e il pavimento.
-- Nessuna memoria: lo stato del lavoro è il lavoro stesso (una casella posata resta posata). Un muratore porta dalla catasta
-- un pezzo per volta, cammina fino al punto e lo posa dopo un po' di lavoro; se chi lavora muore, il prossimo trova il punto da cui ripartire.
local M = {}

local PIANTA = { "bbbbb", "bfffb", "bfffb", "bfffb", "bbdbb" }

-- Le fasi del lavoro, ognuna dice cosa vuole in una casella della pianta (o niente).
local FASI = {
  { "platea", function(_) return "l" end },
  { "muri", function(c) return c == "b" and "b" or nil end },
  { "finiture", function(c) return c ~= "b" and c or nil end },
}

-- La prossima casella da posare secondo il terreno com'è, o nil a casa finita.
local function prossima(s)
  for fase, F in ipairs(FASI) do
    for r = 1, #PIANTA do
      for c = 1, #PIANTA[r] do
        local vuole = F[2](PIANTA[r]:sub(c, c))
        if vuole then
          local x, y = s.x + c - 1, s.y + r - 1
          local ora = world.tile(x, y)
          -- La platea è fatta anche dove ci stanno già sopra muri e pavimenti.
          local fatto = ora == vuole or (fase == 1 and (ora == "b" or ora == "f" or ora == "d"))
          if not fatto then return x, y, vuole, F[1] end
        end
      end
    end
  end
  return nil
end

-- Le fasi lasciano la casa in muratura e la pianta dice cosa manca: per questo si può contare senza memoria.
local function posate(s)
  local n = 0
  for r = 1, #PIANTA do
    for c = 1, #PIANTA[r] do
      if world.tile(s.x + c - 1, s.y + r - 1) == PIANTA[r]:sub(c, c) then n = n + 1 end
    end
  end
  return n
end

function M.on_ui(user, azione)
  local s = ecs.get(ecs.first("cantiere"), "cantiere")
  return "Siamo a: " .. s.fase
end

function M.update(dt)
  local sid = ecs.first("cantiere")
  if not sid then return end
  local s = ecs.get(sid, "cantiere")
  local x, y, vuole, fase = prossima(s)
  s.fase = fase or "finita"
  s.finite = posate(s)
  -- Un pannello legge solo i componenti di chi guarda: ciò che è di tutti va copiato su ognuno.
  ecs.set(world.player(), "cantiere_visto", { fase = s.fase, finite = s.finite })
  if not x then return end
  -- Un muratore che manca si cerca al prossimo giro: il cantiere non dipende da nessuno.
  if not ecs.first("muratore") then world.spawn("npc.muratore", s.x - 1, s.y - 1) end
  ecs.each("muratore, pos", function(id, m, p)
    if not m.pezzo then
      -- Alla catasta.
      local cat = world.nearest(p.x, p.y, 40, "catasta")
      if not cat then
        s.fase = "manca il materiale"
        return
      end
      local c = ecs.get(cat, "pos")
      local dx, dy = c.x - p.x, c.y - p.y
      local d = math.sqrt(dx * dx + dy * dy)
      if d < 0.6 then
        m.pezzo = true
      else
        p.x, p.y = p.x + dx / d * 8 * dt, p.y + dy / d * 8 * dt
      end
      return
    end
    local dx, dy = x + 0.5 - p.x, y + 0.5 - p.y
    local d = math.sqrt(dx * dx + dy * dy)
    if d > 0.9 then
      p.x, p.y = p.x + dx / d * 8 * dt, p.y + dy / d * 8 * dt
      return
    end
    m.lavoro = (m.lavoro or 0) + dt
    if m.lavoro >= s.ritmo then
      m.lavoro, m.pezzo = 0, false
      if world.set_tile(x, y, vuole) then
        s.posati = s.posati + 1
        world.speak(id, "Un altro.")
      end
    end
  end)
end

return M
