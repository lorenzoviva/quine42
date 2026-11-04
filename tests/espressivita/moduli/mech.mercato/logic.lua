-- Il mercato: un prezzo di tutti, che sale quando si compra e torna giù da solo col tempo.
local M = {}

local function mostra(user, m)
  ecs.set(user, "mercato_visto", { prezzo = m.prezzo })
end

function M.on_ui(user, azione)
  local m = ecs.get(ecs.first("mercato"), "mercato")
  if azione == "compra" then
    m.scorta = m.scorta - 1
    m.prezzo = m.prezzo + 1
  elseif azione == "ricorda" then
    -- Il solo posto scrivibile da Lua che dura per un viandante: uno stato senza scadenza. È un trucco, non un magazzino.
    local st = ecs.get(user, "stati") or {}
    st.taccuino = { velocita = 1, peso = 0, luce = 0, fino = 0, prezzo = m.prezzo }
    ecs.set(user, "stati", st)
  end
  mostra(user, m)
  return nil
end

function M.update(dt)
  local id = ecs.first("mercato")
  if not id then return end
  local m = ecs.get(id, "mercato")
  if m.prezzo > 10 then m.prezzo = math.max(10, m.prezzo - 0.1 * dt) end
  mostra(world.player(), m)
end

return M
