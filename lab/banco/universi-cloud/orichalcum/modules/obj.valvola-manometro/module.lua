-- Valvola e manometro: la lettura la scrive sys.pressione; il volantino sfoga la caldaia vicina.
local M = {}

local function lettura(id)
  local m = ecs.get(id, "manometro")
  local v = ecs.get(id, "valvola")
  local l = m and m.lettura or 0
  -- Un manometro non tarato segna mezza atmosfera in meno del vero, come quelli della fonderia nuova.
  if v and not v.tarata then l = math.max(0, l - 0.5) end
  return l
end

function M.on_interact(id, user)
  return string.format("La lancetta trema su %.1f atmosfere.", lettura(id))
end

function M.on_act(id, user, action)
  if action == "leggi" then return M.on_interact(id, user) end
  if action == "tara" then
    local v = ecs.get(id, "valvola")
    if not v then return "Non c'è niente da tarare." end
    if v.tarata then return "È già tarato: la lancetta dice il vero." end
    v.tarata = true
    return "Con il cacciavite fine giri la vite di taratura: la lancetta salta di mezza atmosfera. Ora dice il vero."
  end
  if action == "apri" then
    local p = ecs.get(id, "pos")
    local c = p and world.nearest(p.x, p.y, 4, "caldaia")
    local cc = c and ecs.get(c, "caldaia")
    if not cc then return "Il volantino gira a vuoto: il tubo non porta a nessuna caldaia." end
    if (cc.pressione or 0) < 0.5 then return "Il volantino gira, ma non esce niente: la caldaia è a riposo." end
    cc.pressione = math.max(0, cc.pressione - 3)
    if c then world.speak(c, "Fsss...") end
    return string.format("Il vapore esce sibilando dal tubo. Ora la caldaia è a %.1f atmosfere.", cc.pressione)
  end
  return M.on_interact(id, user)
end

return M
