-- Sintetista: affari col viandante; compra polvere di cristallo, conosce il mercato delle rune (vere e false).
local M = {}

local function d(id)
  local v = ecs.get(id, "dialogo")
  if not v then v = { fase = 0, fiducia = 0, affari = 0 }; ecs.set(id, "dialogo", v) end
  -- Il manifest dà un dialogo con fase e fiducia soltanto: il resto si aggiunge qui.
  if v.affari == nil then v.affari = 0 end
  return v
end

function M.on_act(id, user, action)
  local v = d(id)
  if action == "affare" then
    v.fase = v.fase + 1
    if v.affari >= 2 then return "«Per te, amico mio, una lastra di metamateriale a metà prezzo. Ma non dirlo alla guardia dell'acqua.»" end
    return "«Polvere di cristallo, porta polvere di cristallo. Ne faccio lastre, le lastre diventano scudi e lenti, e tutti mangiano.»"
  end
  if action == "vendi" then
    inventory.remove(user, items.find("Polvere di cristallo"), 1)
    inventory.add(user, items.find("Cella energetica"), 2)
    v.affari = v.affari + 1
    v.fiducia = v.fiducia + 1
    return "La pesa sul palmo, annusa, approva. «Viola buona, della Gola profonda. Due celle, e non contrattare.»"
  end
  if action == "rune" then
    local vere = 0
    for _, t in ipairs({ "grava", "lieve", "tunnel", "intreccio", "onda", "vuoto", "marea", "massa", "spin", "quanto", "orbita", "stasi" }) do
      if inventory.count(user, "rune:" .. t) > 0 then vere = vere + 1 end
    end
    if vere > 0 then return "Gli brillano gli occhi. «Hai rune vere in tasca, si capisce da come cammini. Le compagnie delle torri pagano bene. Io pago meglio, e non faccio domande.»" end
    return "«Rune? Al banchetto di Ilde in piazza ne trovi quante vuoi. Senza luce, però. Quelle vere stanno per terra, sotto la pioggia: basta saper guardare.»"
  end
end

return M
