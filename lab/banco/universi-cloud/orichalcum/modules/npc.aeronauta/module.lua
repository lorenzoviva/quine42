-- Aeronauta: dialoghi a rami (il passo sta nel componente dialogo), scambi e reazioni agli stati di chi ascolta.
local M = {}

local CHIEDI = {"Una tela, un bruciatore e il vento giusto: un dirigibile non chiede altro.", "La Rondine è bucata sopra il bruciatore. Con un tubo di rame nuovo e una toppa riparte.", "Il ponente arriva fra tre giorni. Se la Rondine non è pronta, il debito con la Casa Ramelli mi mangia."}
local RACCONTI = { mattina = "All'alba si leggono le nuvole: chi le legge male non torna.", giorno = "Di giorno si caricano le casse e si tendono i cavi.", sera = "La sera si gioca a carte nel piazzale, aspettando il vento.", notte = "Di notte, dalla torre, si vede passare un dirigibile senza fanali. Non è dei nostri." }
local SCAMBI = {
  ["consegna-tubo"] = { chiede = "item.tubo-rame", quanti = 1, da = "item.soldo-rame", dati = 6, testo = "Un tubo di rame! Sei soldi, e il mio grazie quando la Rondine vola." },
  ["scambia-mappa"] = { chiede = "item.mappa-cunicoli", quanti = 1, da = "item.orologio-tasca", dati = 1, testo = "Una mappa di Solfara: dall'alto i cunicoli non si vedono. Prendi questo orologio, va avanti di due minuti." },
}
local REAZIONI = {
  { "passo a molla", "Con quello slancio potresti saltare sulla passerella senza scaletta." },
  { "nella fuliggine", "Lassù quella fuliggine te la porta via il vento in un attimo." },
}

local function nome(id)
  local i = ecs.get(id, "identity")
  return (i and i.name) or "Aeronauta"
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
