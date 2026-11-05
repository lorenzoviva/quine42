from common import module
module('sys.pressione',{"name":"Pressione delle caldaie","kind":"system","order":40,
"description":"Le caldaie delle Città del Vapore: il carbone brucia, l'acqua diventa vapore, la pressione sale; le valvole di sfogo fischiano quando è troppa; i manometri vicini la segnano; la fiamma di una brace o di una scintilla accanto a una caldaia spenta la riaccende."},r'''
-- Pressione delle caldaie: stato nei componenti (caldaia, manometro), logica senza stato.
local M = {}

local MASSIMA = 12      -- atmosfere: oltre, le valvole di sfogo si aprono da sole
local FISCHIO = 9       -- da qui la caldaia fischia
local CONSUMO = 0.05    -- carbone bruciato al secondo, quando è accesa
local EVAPORA = 0.02    -- acqua consumata al secondo, quando è accesa

local function fiamma_vicina(x, y)
  local trovata = false
  ecs.each("effimero, fuoco, pos", function(_, _, _, p)
    local dx, dy = p.x - x, p.y - y
    if dx * dx + dy * dy < 2.25 then trovata = true end
  end)
  return trovata
end

function M.update(dt)
  if type(dt) ~= "number" or dt <= 0 then return end
  ecs.each("caldaia, pos", function(id, c, p)
    -- Una caldaia spenta con carbone e acqua si riaccende se una fiamma le arriva accanto.
    if not c.accesa and (c.carbone or 0) > 0 and (c.acqua or 0) > 0 and fiamma_vicina(p.x, p.y) then
      c.accesa = true
      world.speak(id, "Fuuum! Il fuoco prende.")
    end
    if c.accesa then
      if (c.carbone or 0) <= 0 or (c.acqua or 0) <= 0 then
        c.accesa = false
        world.speak(id, (c.acqua or 0) <= 0 and "La caldaia si spegne: non ha più acqua." or "La caldaia si spegne: il carbone è finito.")
      else
        c.carbone = math.max(0, c.carbone - CONSUMO * dt)
        c.acqua = math.max(0, c.acqua - EVAPORA * dt)
        c.pressione = math.min(MASSIMA + 2, (c.pressione or 0) + 0.25 * dt)
      end
    else
      c.pressione = math.max(0, (c.pressione or 0) - 0.4 * dt)
    end
    if c.pressione > MASSIMA then
      c.pressione = MASSIMA - 3
      c.sfoghi = (c.sfoghi or 0) + 1
      world.speak(id, "FSSSSSS! Le due valvole di sfogo si aprono insieme.")
    elseif c.pressione > FISCHIO and (c.fischio or 0) < time then
      c.fischio = time + 6
      world.speak(id, "Fiiii... la caldaia fischia.")
    end
  end)
  -- Ogni manometro segna la caldaia più vicina.
  ecs.each("manometro, pos", function(id, m, p)
    local c = world.nearest(p.x, p.y, 4, "caldaia")
    local cc = c and ecs.get(c, "caldaia")
    m.lettura = cc and math.floor((cc.pressione or 0) * 10 + 0.5) / 10 or 0
  end)
end

return M
''')
module('sys.meccanismi',{"name":"Meccanismi della città","kind":"system","order":46,
"description":"Ciò che nelle Città del Vapore va a molla, a gas o ad aria: le capsule del telegrafo pneumatico che arrivano, i guardiani d'ottone che si scaricano camminando, i lampioni a gas che si accendono di sera e si riaccendono a una scintilla."},r'''
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
''')
