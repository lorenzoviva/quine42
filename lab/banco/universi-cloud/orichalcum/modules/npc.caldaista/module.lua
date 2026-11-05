-- Caldaista: dialoghi a rami (il passo sta nel componente dialogo), scambi e reazioni agli stati di chi ascolta.
local M = {}

local CHIEDI = {"Carbone, acqua, fuoco. E le valvole: due, sempre due. Chi ne mette una sola non ha visto lo scoppio.", "Senti come fischia quella laggiù? Nove atmosfere. A dodici si aprono gli sfoghi da sole, se uno ha avuto giudizio.", "Dieci ore, non dodici: è tutto quello che chiede la Gilda. Lunedì, alla Pesa, lo diciamo davanti a tutti."}
local RACCONTI = { mattina = "Il primo fuoco della giornata è quello che conta: se parte storto, storta è la giornata.", giorno = "A mezzogiorno si mangia seduti sul carbone, e il carbone è caldo.", sera = "La sera si va nel vicolo a parlare di turni. Non di altro.", notte = "Di notte le caldaie dormono, ma una si tiene sempre accesa. Non si sa mai." }
local SCAMBI = {
  ["scambia-carbone"] = { chiede = "item.pane-nero", quanti = 1, da = "item.carbone", dati = 3, testo = "Affare fatto: tre pezzi di carbone buono, di quello che non fuma." },
  ["scambia-chiave"] = { chiede = "item.soldo-rame", quanti = 5, da = "item.chiave-inglese", dati = 1, testo = "Ecco, la mia vecchia: battila tre volte su ogni caldaia nuova, come si usa." },
}
local REAZIONI = {
  { "nel vapore", "Ehi, sei tutto vapore! Ti sei messo davanti a uno sfiato?" },
  { "nella fuliggine", "Mamma mia, sembri uscito da un comignolo." },
  { "tempra d'ottone", "Hai la pelle che luccica come una fascia di caldaia, sai?" },
}

local function nome(id)
  local i = ecs.get(id, "identity")
  return (i and i.name) or "Caldaista"
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

  return chi .. " ti guarda e aspetta."
end

return M
