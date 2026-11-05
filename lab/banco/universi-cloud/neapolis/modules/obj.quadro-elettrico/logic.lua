-- Cabina elettrica: quando il quartiere è al buio (sys.quartiere), un fusibile nuovo o la leva generale ridanno la luce.
-- Chi porta la runa dei fili o ne è carico sente il quadro ronzare in un altro modo.
local M = {}
-- La parte del giorno, come la conta il kernel (un giorno dura 600 secondi).
local function fase()
  local p = ((time or 0) / 600 + 0.12) % 1
  if p < 0.12 or p >= 0.96 then return "mattina" end
  if p < 0.42 then return "giorno" end
  if p < 0.58 then return "sera" end
  return "notte"
end

local function giorno() return math.floor((time or 0) / 600 + 0.12) end

-- Uno stato che le rune pronunciate lasciano addosso al viandante (vedi core.effects).
local function addosso(user, nome)
  local st = ecs.get(user, "stati")
  return st and st[nome] and true or false
end

local function quartiere()
  local q = ecs.first("quartiere")
  return q, q and ecs.get(q, "quartiere")
end

local function dai(user, nome, n)
  local it = items.find(nome)
  if it then return inventory.add(user, it, n or 1) end
  return 0
end

function M.on_act(id, user, action)
  local q, s = quartiere()
  if action == "contatori" then
    if inventory.count(user, "rune:corrente") > 0 or addosso(user, "carico") then
      return "I contatori girano, tutti nello stesso verso. Tutti tranne quello del cantiere: gira al contrario, e ronza in un modo che senti nei denti."
    end
    if s and s.buio then return "I contatori sono fermi. Il quartiere è al buio: il fusibile generale è saltato." end
    return "I contatori girano tranquilli. Uno, con l’etichetta «cantiere L2», gira al contrario."
  end
  if action == "fusibile" then
    inventory.remove(user, "item.fusibile", 1)
    dai(user, "Fusibile bruciato", 1)
    if q and s and s.buio then
      ecs.set(q, "quartiere", { buio = false, fase = s.fase, giorno = s.giorno, riparato = (s.riparato or 0) + 1, ricontrolla = true })
      return "Togli il fusibile annerito e metti quello nuovo. Un colpo secco, e i lampioni del rione si riaccendono uno dopo l’altro."
    end
    return "Cambi il fusibile, per scrupolo. Quello vecchio era ancora buono, quasi."
  end
  if action == "leva" then
    if q and s and s.buio then
      ecs.set(q, "quartiere", { buio = false, fase = s.fase, giorno = s.giorno, riparato = (s.riparato or 0) + 1, ricontrolla = true })
      return "Fai leva col cacciavite sullo sportello e tiri giù la leva generale: la luce torna. Ma il quadro col lucchetto nuovo, quello del cantiere, resta acceso per conto suo."
    end
    return "La leva è già su. Meglio non giocarci: quella è corrente vera."
  end
  return nil
end

return M
