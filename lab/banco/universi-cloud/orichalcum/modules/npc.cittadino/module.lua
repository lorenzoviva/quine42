-- Cittadino: dialoghi a rami (il passo sta nel componente dialogo), scambi e reazioni agli stati di chi ascolta.
local M = {}

local CHIEDI = {"Lunedì c'è la Pesa Grande: nessuno compra niente prima di mezzogiorno, si sa.", "L'oricalco cala da tre settimane. Le caldaie nuove fischiano. Qualcuno dice che le due cose vanno insieme.", "Al porto mancano casse di rame, e di notte passa un dirigibile senza fanali. Pesalo in piazza, se hai coraggio."}
local RACCONTI = { mattina = "La mattina le notizie sono fresche come il pane.", giorno = "Di giorno i telai cantano e la piazza vende.", sera = "La sera si sta nel cortile a chiacchierare con le vicine.", notte = "Di notte, sulle banchine, è meglio non fare domande." }
local SCAMBI = {
  ["scambia-giornale"] = { chiede = "item.soldo-rame", quanti = 1, da = "item.capsula-pneumatica", dati = 1, testo = "Il giornale te lo racconto io, e per giunta ti do questa capsula vuota: mandala a chi vuoi." },
  ["scambia-capsula"] = { chiede = "item.mela-renetta", quanti = 1, da = "item.capsula-pneumatica", dati = 1, testo = "Una renetta delle Trebbie! Prendi la capsula, è tua." },
}
local REAZIONI = {
  { "nella fuliggine", "Sei nero come lo spazzacamino del vicolo." },
  { "calamitato", "Hai addosso chiodi e limatura: sembri il carro del ferraio." },
}

local function nome(id)
  local i = ecs.get(id, "identity")
  return (i and i.name) or "Cittadino"
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
