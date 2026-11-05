-- Il quartiere: un'entità sola con il componente "quartiere" { buio, fase, giorno, riparato }.
-- Cambia qualcosa solo quando cambia la parte del giorno: i lampioni (tag lampione) e le insegne (tag insegna)
-- si accendono la sera e la notte se c'è corrente; certe notti (scelte dal giorno, uguali per tutti) va via la luce.
local M = {}

local function fase()
  local p = ((time or 0) / 600 + 0.12) % 1
  if p < 0.12 or p >= 0.96 then return "mattina" end
  if p < 0.42 then return "giorno" end
  if p < 0.58 then return "sera" end
  return "notte"
end

local function accendi(acceso)
  ecs.each("luce, module", function(id, l, m)
    if world.has_tag(id, "lampione") or world.has_tag(id, "insegna") then
      l.accesa = acceso
    end
  end)
end

function M.update(dt)
  local q = ecs.first("quartiere")
  if not q then
    q = ecs.spawn({ quartiere = { buio = false, fase = "", giorno = -1, riparato = 0 } })
    if not q then return end
  end
  local s = ecs.get(q, "quartiere")
  if not s then return end
  local f = fase()
  local g = math.floor((time or 0) / 600 + 0.12)
  if s.fase == f and s.giorno == g and not s.ricontrolla then return end
  local buio = s.buio
  -- La notte comincia: certe notti il cantiere attacca le pompe e salta tutto. Il mattino rimette la corrente.
  if f == "notte" and s.fase ~= "notte" then buio = hash(g, 77) < 0.4 end
  if f == "mattina" then buio = false end
  ecs.set(q, "quartiere", { buio = buio, fase = f, giorno = g, riparato = s.riparato or 0 })
  accendi((f == "sera" or f == "notte") and not buio)
end

return M
