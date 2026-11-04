-- Le stagioni: un calendario è una funzione del tempo, e il tempo del mondo dura tra una sessione e l'altra.
-- L'inverno mette la neve dove il viandante la vede: casella per casella, perché il colore di un terreno non si cambia.
local M = {}
local NOMI = { "primavera", "estate", "autunno", "inverno" }

function M.update(dt)
  local id = ecs.first("almanacco")
  if not id then return end
  local a = ecs.get(id, "almanacco")
  local giorno = math.floor(time / a.giornata)
  local stagione = NOMI[(giorno // a.giorni_stagione) % 4 + 1]
  ecs.set(world.player(), "calendario", { giorno = giorno, stagione = stagione })
  local p = world.player_pos()
  local da, a_cosa = "n", "g"
  if stagione == "inverno" then da, a_cosa = "g", "n" end
  local cx, cy = math.floor(p.x), math.floor(p.y)
  local fatte = 0
  for dy = -8, 8 do
    for dx = -8, 8 do
      if fatte < 40 and world.tile(cx + dx, cy + dy) == da then
        world.set_tile(cx + dx, cy + dy, a_cosa)
        fatte = fatte + 1
      end
    end
  end
end

return M
