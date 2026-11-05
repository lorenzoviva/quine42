-- Abbeveratoio: l'acqua cala col tempo (il sole della piana) e si riempie a secchiate.
local M = {}

local function livello(id)
  local a = ecs.get(id, "abbeveratoio") or { acqua = 3, quando = time }
  local passati = math.floor((time - a.quando) / 90)
  if passati > 0 then
    a.acqua = math.max(0, a.acqua - passati)
    a.quando = time
  end
  return a
end

function M.on_act(id, user, action)
  local a = livello(id)
  local testo
  if action == "riempi" then
    if a.acqua >= 5 then return "L'abbeveratoio è pieno fino all'orlo." end
    a.acqua = a.acqua + 1
    testo = "Svuoti il secchio nella vasca: un cavallo, lontano, alza la testa."
  elseif action == "guarda" then
    local stati = { "La vasca è asciutta: sul fondo, solo polvere e un ferro di cavallo.", "Un dito d'acqua tiepida.", "Acqua a metà, con qualche paglia che galleggia.", "Acqua fresca, quasi piena.", "Acqua fino all'orlo: ci si specchia il cielo.", "Acqua fino all'orlo: ci si specchia il cielo." }
    testo = stati[a.acqua + 1]
  elseif action == "bevi" then
    if a.acqua <= 0 then return "Non c'è niente da bere qui." end
    testo = "L'acqua sa di legno e di ferro, ma ti toglie la polvere dalla gola."
  else
    return nil
  end
  ecs.set(id, "abbeveratoio", a)
  return testo
end

return M
