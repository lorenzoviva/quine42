-- Macchinista: dialoghi a rami (il passo sta nel componente dialogo), scambi e reazioni agli stati di chi ascolta.
local M = {}

local CHIEDI = {"La linea alta parte all'alba e torna col buio. Una rotaia sola, e sotto il vuoto.", "Ultimamente dietro la rimessa tagliano i cavi di rame. Puliti, come con le cesoie.", "Se vedi qualcuno con le cesoie dei frenatori dove non dovrebbe stare, dimmelo. La Compagnia paga."}
local RACCONTI = { mattina = "All'alba si scalda la locomotiva: un'ora di carbone prima del primo fischio.", giorno = "Di giorno il minerale scende dalle miniere: trenta vagoni, e Tizzone sopra il primo.", sera = "La sera si fuma la pipa al Giardino della Fuliggine.", notte = "Di notte lo scalo è buio, e qualcuno ci gira con una lanterna schermata." }
local SCAMBI = {
  ["scambia-biglietto"] = { chiede = "item.soldo-rame", quanti = 2, da = "item.biglietto-linea", dati = 1, testo = "Ecco il biglietto, forato e verde. Tieniti forte nelle curve." },
  ["scambia-olio"] = { chiede = "item.oliatore", quanti = 1, da = "item.caffe-nero", dati = 2, testo = "Un oliatore! Ci voleva. Tieni, due caffè neri della rimessa." },
}
local REAZIONI = {
  { "nel vapore", "Sei fumante come una locomotiva in partenza." },
  { "passo a molla", "Con quel passo arriveresti alle miniere prima del treno." },
}

local function nome(id)
  local i = ecs.get(id, "identity")
  return (i and i.name) or "Macchinista"
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
