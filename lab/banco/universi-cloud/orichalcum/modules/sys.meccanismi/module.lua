-- Meccanismi: telegrafo pneumatico, guardiani a molla, lampioni a gas. Stato nei componenti.
local M = {}

local GIORNO = 600

local function sera()
  local f = (time / GIORNO + 0.12) % 1
  return f >= 0.42
end

local function scintilla_vicina(x, y)
  local trovata = false
  ecs.each("effimero, pos", function(id, _, p)
    if ecs.get(id, "fuoco") or ecs.get(id, "luce") then
      local dx, dy = p.x - x, p.y - y
      if dx * dx + dy * dy < 4 then trovata = true end
    end
  end)
  return trovata
end

function M.update(dt)
  if type(dt) ~= "number" or dt <= 0 then return end
  -- Le capsule in viaggio arrivano: un soffio, un tonfo, e la capsula è nel cassetto.
  ecs.each("telegrafo, pos", function(id, t, p)
    if t.in_viaggio and time >= (t.arrivo or 0) then
      t.in_viaggio = false
      t.arrivate = (t.arrivate or 0) + 1
      world.speak(id, "Pof! Una capsula d'ottone cade nel cassetto.")
      world.spawn("item.capsula-pneumatica", p.x + 0.6, p.y + 0.3)
    end
  end)
  -- I guardiani d'ottone si scaricano camminando; scarichi si fermano.
  ecs.each("automa", function(id, a)
    local w = ecs.get(id, "wander")
    a.carica = math.max(0, (a.carica or 0) - 0.4 * dt)
    if w then w.speed = a.carica > 0 and 0.9 or 0 end
    if a.carica <= 0 and not a.fermo then
      a.fermo = true
      world.speak(id, "Tic... tic... tic. Il guardiano si ferma, la molla è scarica.")
    elseif a.carica > 0 then
      a.fermo = false
    end
  end)
  -- I lampioni: il lampionaio li accende di sera; una scintilla o una luce vicina riaccende quello spento.
  local s = sera()
  ecs.each("lampione, luce, pos", function(id, l, luce, p)
    if l.rotto then
      luce.accesa = false
      return
    end
    if s ~= l.sera then
      l.sera = s
      luce.accesa = s or l.acceso_a_mano == true
    end
    if not luce.accesa and scintilla_vicina(p.x, p.y) then
      luce.accesa = true
      world.speak(id, "Il becco del gas prende fuoco con un piccolo schiocco.")
    end
  end)
end

return M
