-- Recinto della mandria: con il cancello aperto i manzi escono uno alla volta; il lazo riporta dentro il più lento.
local M = {}

local function recinto(id) return ecs.get(id, "recinto") or { dentro = 8, fuori = 0, aperto = false } end

function M.on_act(id, user, action)
  local r = recinto(id)
  local testo
  if action == "cancello" then
    r.aperto = not r.aperto
    if r.aperto and r.dentro > 0 then
      r.dentro = r.dentro - 1
      r.fuori = r.fuori + 1
      testo = "Apri il cancello: un manzo esce subito, scuotendo la testa."
    elseif r.aperto then
      testo = "Apri il cancello, ma il recinto è vuoto."
    else
      testo = "Richiudi il cancello e fai il nodo alla corda."
    end
  elseif action == "conta" then
    return "Nel recinto ci sono " .. r.dentro .. " manzi; " .. r.fuori .. " pascolano fuori."
  elseif action == "lazo" then
    if r.fuori <= 0 then return "Fai roteare il lazo per niente: tutti i manzi sono dentro." end
    if hash(id, r.fuori, r.dentro) < 0.6 then
      r.fuori = r.fuori - 1
      r.dentro = r.dentro + 1
      testo = "Il lazo cade dritto sulle corna: riporti il manzo dentro, piano piano."
    else
      testo = "Il lazo sfiora le corna e cade nella polvere. Il manzo ti guarda, per niente impressionato."
    end
  else
    return nil
  end
  ecs.set(id, "recinto", r)
  return testo
end

return M
