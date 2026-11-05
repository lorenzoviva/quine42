-- Fonditrice: dialoghi a rami (il passo sta nel componente dialogo), scambi e reazioni agli stati di chi ascolta.
local M = {}

local CHIEDI = {"Due di minerale, uno di rame, e il forno bianco. Così si fa l'oricalco, da cent'anni.", "La lega nuova è più pallida. Chi la cola lo vede, chi la vende fa finta di no.", "Se vuoi sapere se una lega è giusta, portala a Selene Vitti: lei la sente nei manometri."}
local RACCONTI = { mattina = "La mattina si preparano i crogioli, uno per uno.", giorno = "Di giorno si cola: guai a chi parla durante una colata.", sera = "La sera ci si spalma l'unguento sulle braccia e si mangia con chi si vuole bene.", notte = "Di notte i forni restano accesi, e la gatta dorme sui lingotti tiepidi." }
local SCAMBI = {
  ["scambia-minerale"] = { chiede = "item.carbone", quanti = 3, da = "item.minerale-rosso", dati = 2, testo = "Carbone buono. Prendi due pezzi di minerale rosso, di quello delle vene profonde." },
  ["scambia-oricalco"] = { chiede = "item.lingotto-oricalco", quanti = 1, da = "item.soldo-rame", dati = 12, testo = "Rosso e dorato, come si deve: dodici soldi, il prezzo della Pesa di lunedì." },
}
local REAZIONI = {
  { "tempra d'ottone", "Con quella pelle potresti prendere un crogiolo senza guanti." },
  { "calamitato", "Stai lontano dagli stampi, hai addosso più ferro di un'incudine." },
}

local function nome(id)
  local i = ecs.get(id, "identity")
  return (i and i.name) or "Fonditrice"
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
