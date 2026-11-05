-- Abitante di Sidera: parla tramite il Narratore (persona); le azioni sono un dialogo a rami, la fiducia nel componente "dialogo".
local M = {}

local NOTIZIE = {
  "Dicono che la cabina oggi sia scesa in ritardo: tutti i lampioni del Vicolo hanno tremolato due volte.",
  "Le compagnie hanno alzato ancora il prezzo dell'acqua filtrata. Chi ha una cupola, si salva.",
  "Al Cantiere litigano per la Nonna, il reattore vecchio. Se la spengono, mezzo turno resta a casa.",
  "Una navetta della Gilda è tornata da Orlo Nero pesante più del dovuto. Lo sa anche Ciok Ciok.",
  "Nella Gola dei Cristalli i fari tacciono, di notte. Mio cugino dice che i cristalli cantano.",
}

local function d(id)
  local v = ecs.get(id, "dialogo")
  if not v then v = { fase = 0, fiducia = 0 }; ecs.set(id, "dialogo", v) end
  return v
end

function M.on_spawn(id)
  local w = ecs.get(id, "wander")
  if w then w.speed = 0.8 + hash(id, 5) * 0.6 end
end

function M.on_act(id, user, action)
  local v = d(id)
  if action == "chiedi" then
    v.fase = v.fase + 1
    local i = (math.floor(hash(id, 2) * #NOTIZIE) + v.fase) % #NOTIZIE + 1
    if v.fiducia >= 2 then return "Si avvicina e abbassa la voce: «" .. NOTIZIE[i] .. " Ma questo non l'hai sentito da me.»" end
    return "«" .. NOTIZIE[i] .. "»"
  end
  if action == "offri" then
    inventory.remove(user, items.find("Brodo caldo"), 1)
    v.fiducia = v.fiducia + 2
    return "Prende il bicchiere con tutte e due le mani, per scaldarle. «Bonombo. Questa non me la scordo.» Ora ti parla come a uno di casa."
  end
  if action == "celle" then
    if v.fiducia < 2 then return "Ti guarda dall'alto in basso. «Celle? Io compro tutto dalle compagnie. Tutto in regola.»" end
    if inventory.count(user, "rune:quanto") > 0 then return "«Tu porti Scintilla in tasca e chiedi a me delle celle? Vai al Mercato sotto i Piloni, dal sintetista grasso. Digli che ti mando io.»" end
    return "«Al Mercato sotto i Piloni, dal sintetista con gli anelli di filo. Ma occhio alla guardia dell'acqua.»"
  end
end

return M
