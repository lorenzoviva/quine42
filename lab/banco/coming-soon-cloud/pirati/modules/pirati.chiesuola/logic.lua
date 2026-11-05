-- Chiesuola: l'ago dice dove si trova il molo di Malvasia; il punto segnato resta finché non se ne segna un altro.
local M = {}
local VENTI = { "tramontana", "grecale", "levante", "scirocco", "ostro", "libeccio", "ponente", "maestrale" }

-- La rosa dei venti: nord in alto (y che cala), otto spicchi.
local function vento(dx, dy)
  if dx == 0 and dy == 0 then return VENTI[1] end
  local a = math.atan(dx, -dy)
  local i = math.floor((a / (2 * math.pi)) * 8 + 0.5) % 8
  return VENTI[i + 1]
end

function M.on_act(id, user, action)
  local p = world.player_pos()
  if not p then return "L'ago trema e non si ferma." end
  if action == "leggi" then
    local d = math.sqrt(p.x * p.x + p.y * p.y)
    if d < 3 then return "L'ago gira lento: sei sopra il molo di Malvasia." end
    return "Il molo di Malvasia è verso " .. vento(-p.x, -p.y) .. ", a circa " .. math.floor(d) .. " passi."
  elseif action == "segna" then
    ecs.set(id, "rotta", { x = p.x, y = p.y })
    return "Incidi una tacca sul bordo della chiesuola: questo punto è segnato."
  elseif action == "misura" then
    local r = ecs.get(id, "rotta")
    if not r then return "Non hai ancora segnato un punto di partenza." end
    local dx, dy = p.x - r.x, p.y - r.y
    return "Dal punto segnato hai fatto " .. math.floor(math.sqrt(dx * dx + dy * dy)) .. " passi verso " .. vento(dx, dy) .. "."
  end
  return nil
end

return M
