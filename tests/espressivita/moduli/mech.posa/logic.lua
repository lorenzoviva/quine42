-- Costruzioni del viandante: un muro è una casella e dura; un mobile è un'entità e sparisce alla prossima apertura del mondo.
local M = {}
local AVANTI = { up = { 0, -2 }, down = { 0, 2 }, left = { -2, 0 }, right = { 2, 0 } }

function M.on_ui(user, azione)
  local p = world.player_pos()
  local d = AVANTI[ecs.get(user, "player").facing] or AVANTI.down
  local x, y = p.x + d[1], p.y + d[2]
  if azione == "muro" then
    if not world.set_tile(x, y, "b") then return "Non si può." end
    return "Fatto."
  end
  local id = world.spawn("object.crate", x, y)
  if id then ecs.set(id, "costruito_da", { viandante = user }) end
  return "Fatto."
end

function M.update(dt) end

return M
