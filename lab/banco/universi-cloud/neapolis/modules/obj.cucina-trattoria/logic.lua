-- Cucina della trattoria: con gli ingredienti giusti fa ragù, pizza o cuoppo (il primo che si può); l'assaggio sfama un poco.
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

local PIATTI = {
  { nome = "Ragù della domenica", n = 1, serve = { { "item.pomodori", 2 }, { "item.carne-macinata", 1 } }, testo = "Il ragù borbotta per un’ora piena. Il profumo arriva fino in piazza." },
  { nome = "Pizza a portafoglio", n = 2, serve = { { "item.farina", 1 }, { "item.pomodori", 1 }, { "item.mozzarella", 1 } }, testo = "Impasti, stendi, condisci, inforni: due pizze a portafoglio, piegate in quattro." },
  { nome = "Cuoppo di alici", n = 3, serve = { { "item.alici", 1 }, { "item.farina", 1 } }, testo = "Infarini le alici e le butti nell’olio bollente: tre cuoppi croccanti." },
}

local function basta(user, serve)
  for _, s in ipairs(serve) do
    if inventory.count(user, s[1]) < s[2] then return false end
  end
  return true
end

function M.on_act(id, user, action)
  if action == "cucina" then
    for _, p in ipairs(PIATTI) do
      if basta(user, p.serve) then
        for _, s in ipairs(p.serve) do inventory.remove(user, s[1], s[2]) end
        dai(user, p.nome, p.n)
        return p.testo
      end
    end
    return "Guardi la dispensa e le tue tasche: per un ragù servono pomodori e carne, per la pizza farina, pomodori e mozzarella, per il cuoppo alici e farina."
  end
  if action == "assaggia" then
    local n = ecs.get(user, "needs")
    if n then n.hunger = math.min(100, n.hunger + 6) end
    return "Un cucchiaio di ragù dal pentolone. La cuoca ti guarda: «Piano, che è per la domenica»."
  end
  if action == "forno" then
    if addosso(user, "carico") then return "Il forno si accende da solo con uno sbuffo: la runa che hai pronunciato non si è ancora calmata." end
    return "Giri la manopola e accendi il fiammifero: il forno prende con un tonfo. Ora è pronto per le pizze."
  end
  return nil
end

return M
