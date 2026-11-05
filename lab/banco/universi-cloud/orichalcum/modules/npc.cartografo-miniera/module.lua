-- Gente di miniera: dialoghi a rami (il passo sta nel componente dialogo), scambi e reazioni agli stati di chi ascolta.
local M = {}

local CHIEDI = {"Qui sotto l'acqua è calda come il tè, e a mezzogiorno ci si cuociono le uova.", "Il cunicolo diciassette finisce contro una porta di ghisa. Sulle mappe vecchie, invece, andava avanti.", "La serratura di quella porta ha la forma di un ingranaggio a dodici denti. Chi sa girarlo, sa aprirla."}
local RACCONTI = { mattina = "La mattina si conta chi scende, la sera si conta chi risale.", giorno = "A mezzogiorno uova sode e acqua della sorgente.", sera = "La sera ci si lava nella pozza calda, tutti insieme.", notte = "Di notte la miniera respira: si sente l'acqua che scorre sotto la roccia." }
local SCAMBI = {
  ["scambia-uova"] = { chiede = "item.pane-nero", quanti = 1, da = "item.uova-sode", dati = 2, testo = "Due uova della sorgente, ancora tiepide. E un sorso d'acqua, offro io." },
  ["scambia-lanterna"] = { chiede = "item.soldo-rame", quanti = 4, da = "item.lanterna-carburo", dati = 1, testo = "Riempila di carburo ogni mattina e non ti lascerà mai al buio." },
}
local REAZIONI = {
  { "nella fuliggine", "Ti sei rotolato nella polvere di carbone? Qui sotto si fa così." },
  { "nel vapore", "Sei fumante come una pozza della sorgente." },
}

local function nome(id)
  local i = ecs.get(id, "identity")
  return (i and i.name) or "Gente di miniera"
end

local function momento()
  local f = (time / 600 + 0.12) % 1
  if f < 0.12 or f >= 0.96 then return "mattina" end
  if f < 0.42 then return "giorno" end
  if f < 0.58 then return "sera" end
  return "notte"
end

-- Una reazione a ciò che il viandante si porta addosso (gli stati che gli incantesimi lasciano), se c'è.
local function reazione(user)
  local st = ecs.get(user, "stati")
  if not st then return nil end
  for _, r in ipairs(REAZIONI) do
    if st[r[1]] then return r[2] end
  end
  return nil
end

function M.on_spawn(id)
  local w = ecs.get(id, "wander")
  if w then w.speed = 1.1 * (0.8 + hash(id, 5) * 0.4) end
  ecs.set(id, "dialogo", { passo = 0, scambi = 0 })
end

function M.on_act(id, user, action)
  local d = ecs.get(id, "dialogo")
  if not d then
    ecs.set(id, "dialogo", { passo = 0, scambi = 0 })
    d = ecs.get(id, "dialogo")
  end
  local chi = nome(id)
  local r = reazione(user)
  if action == "chiedi" then
    local passo = math.min((d.passo or 0) + 1, #CHIEDI)
    d.passo = passo
    local t = CHIEDI[passo]
    if r and passo == 1 then t = r .. " " .. t end
    world.speak(id, t)
    return chi .. ": «" .. t .. "»"
  elseif action == "racconta" then
    local t = RACCONTI[momento()]
    return chi .. ": «" .. t .. "»"
  end
  local s = SCAMBI[action]
  if s then
    if inventory.count(user, s.chiede) < s.quanti then return chi .. " scuote la testa: «Non hai quello che mi serve.»" end
    inventory.remove(user, s.chiede, s.quanti)
    inventory.add(user, s.da, s.dati)
    d.scambi = (d.scambi or 0) + 1
    return chi .. ": «" .. s.testo .. "»"
  end

  if action == "mappa" then
    if inventory.count(user, "item.mappa-cunicoli") > 0 then return chi .. ": «Hai già una mappa. Guarda il diciassette: va avanti, oltre la porta.»" end
    inventory.add(user, "item.mappa-cunicoli", 1)
    return chi .. ": «Tieni, una copia a matita. Non perderla nei cunicoli.»"
  end
  return chi .. " ti guarda e aspetta."
end

return M
